import { useState, useEffect, useCallback, useRef } from 'react'
import { getApiUrl } from '@/lib/api-config'
import { paybillApi } from '@/lib/api'

interface PaybillTransaction {
  id: number
  trans_id: string
  device_id: string
  client_id: number
  amount: number
  formatted_amount: string
  expected_amount?: number
  status: 'pending' | 'validated' | 'validated_pending_confirmation' | 'processed' | 'failed' | 'rejected'
  amount_matched: boolean
  credited_to_account: boolean
  payment_type: string
  customer_name: string
  phone: string
  processing_notes?: string
  processed_at?: string
  processed_by?: string
  created_at: string
  updated_at: string
}

interface PollingInfo {
  should_continue: boolean
  interval_seconds: number
  next_poll_time?: string
  message: string
  max_attempts?: number
  stop_polling_after?: string
}

interface PaybillStatus {
  success: boolean
  has_payments: boolean
  device_id: string
  latest_payment?: PaybillTransaction
  summary?: {
    total_payments: number
    total_amount: number
    formatted_total_amount: string
    processed_payments: number
    pending_payments: number
  }
  polling: PollingInfo
  timestamp: string
  message: string
}

interface UsePaybillMonitorOptions {
  deviceId?: string
  clientId?: string
  transactionId?: string
  maxAttempts?: number
  onTransactionFound?: (data: { transaction: PaybillTransaction; type: string }) => void
  onTransactionSuccess?: (data: { transaction: PaybillTransaction; message: string }) => void
  onTransactionFailed?: (data: { transaction: PaybillTransaction; reason: string }) => void
  onPollingStarted?: () => void
  onPollingStopped?: () => void
}

export function usePaybillMonitor(options: UsePaybillMonitorOptions = {}) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState<PaybillTransaction | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString())
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxAttempts = options.maxAttempts || 100

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  /**
   * Start monitoring a specific device payment after PayBill payment
   */
  const startDeviceMonitoring = useCallback(async (deviceId: string, expectedAmount?: number) => {
    console.log(`🚀 Starting automatic monitoring for device: ${deviceId}`)
    
    setIsMonitoring(true)
    setAttempts(0)
    setError(null)
    options.onPollingStarted?.()
    
    pollDeviceStatus(deviceId, expectedAmount)
  }, [options])

  /**
   * Start monitoring for specific transaction by ID
   */
  const startTransactionMonitoring = useCallback(async (transactionId: string) => {
    console.log(`🎯 Starting transaction monitoring for: ${transactionId}`)
    
    setIsMonitoring(true)
    setAttempts(0)
    setError(null)
    options.onPollingStarted?.()
    
    pollTransactionStatus(transactionId)
  }, [options])

  /**
   * Start dashboard monitoring for client (real-time updates)
   */
  const startDashboardMonitoring = useCallback(async (clientId: string, deviceIds: string[] = []) => {
    if (!clientId) {
      console.error('❌ Client ID required for dashboard monitoring')
      return
    }

    console.log(`📊 Starting dashboard monitoring for client: ${clientId}`)
    
    setIsMonitoring(true)
    setAttempts(0)
    setError(null)
    setLastUpdate(new Date().toISOString())
    options.onPollingStarted?.()
    
    pollClientTransactions(clientId, deviceIds)
  }, [options])

  /**
   * Poll device payment status with C2B transaction checking
   */
  const pollDeviceStatus = async (deviceId: string, expectedAmount?: number) => {
    try {
      console.log(`🔍 Polling device status for: ${deviceId}`)
      
      // Check both paybill transactions and C2B transactions
      const [paybillResponse, c2bResponse] = await Promise.all([
        paybillApi.checkPaymentStatus(deviceId),
        paybillApi.checkC2BTransaction(deviceId, expectedAmount, lastUpdate)
      ])

      console.log(`📊 Device ${deviceId} status:`, { paybill: paybillResponse, c2b: c2bResponse })

      // Check C2B transactions first (more direct from M-Pesa)
      if (c2bResponse.success && c2bResponse.found && c2bResponse.transaction) {
        console.log('💰 C2B transaction found!', c2bResponse.transaction)
        setCurrentTransaction(c2bResponse.transaction)
        
        options.onTransactionFound?.({
          transaction: c2bResponse.transaction,
          type: 'c2b_payment'
        })

        console.log('✅ C2B Payment received!', c2bResponse.transaction)
        options.onTransactionSuccess?.({
          transaction: c2bResponse.transaction,
          message: 'Payment received via M-Pesa!'
        })
        stopMonitoring()
        return
      }

      // Fallback to check paybill transactions
      const data = paybillResponse.data
      if (data.success && data.has_payments && data.latest_payment) {
        const payment = data.latest_payment
        setCurrentTransaction(payment)
        
        // Trigger found callback
        options.onTransactionFound?.({
          transaction: payment,
          type: 'device_payment'
        })

        // Check if payment is successful
        if (payment.status === 'processed' && payment.credited_to_account) {
          console.log('✅ Payment successful!', payment)
          options.onTransactionSuccess?.({
            transaction: payment,
            message: 'Payment processed successfully!'
          })
          stopMonitoring()
          return
        }

        // Check if payment failed
        if (['failed', 'rejected'].includes(payment.status)) {
          console.log('❌ Payment failed!', payment)
          options.onTransactionFailed?.({
            transaction: payment,
            reason: payment.processing_notes || 'Payment failed'
          })
          stopMonitoring()
          return
        }
      }

      // Continue polling based on server recommendation
      if (data.polling?.should_continue && attempts < maxAttempts) {
        const interval = data.polling.interval_seconds * 1000
        console.log(`🔄 Continuing polling in ${data.polling.interval_seconds}s`)
        
        timeoutRef.current = setTimeout(() => {
          setAttempts(prev => prev + 1)
          pollDeviceStatus(deviceId, expectedAmount)
        }, interval)
      } else {
        console.log('🛑 Polling stopped (server recommendation or max attempts)')
        stopMonitoring()
      }

    } catch (error) {
      console.error('❌ Error polling device status:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      // Retry with longer interval on error
      if (attempts < maxAttempts) {
        timeoutRef.current = setTimeout(() => {
          setAttempts(prev => prev + 1)
          pollDeviceStatus(deviceId, expectedAmount)
        }, 10000)
      } else {
        stopMonitoring()
      }
    }
  }

  /**
   * Poll specific transaction status
   */
  const pollTransactionStatus = async (transactionId: string) => {
    try {
      const response = await paybillApi.getLiveTransactionStatus(transactionId)
      console.log(`🎯 Transaction ${transactionId} status:`, response)

      const data = response

      if (data.success && data.found && data.transaction) {
        const transaction = data.transaction
        setCurrentTransaction(transaction)
        
        options.onTransactionFound?.({
          transaction,
          type: 'transaction_update'
        })

        // Check if processing is complete
        if (data.status_info?.is_completed) {
          if (data.status_info.is_successful) {
            console.log('✅ Transaction successful!', transaction)
            options.onTransactionSuccess?.({
              transaction,
              message: 'Transaction completed successfully!'
            })
          } else if (data.status_info.is_failed) {
            console.log('❌ Transaction failed!', transaction)
            options.onTransactionFailed?.({
              transaction,
              reason: transaction.processing_notes || 'Transaction failed'
            })
          }
          stopMonitoring()
          return
        }
      }

      // Continue polling based on server recommendation
      if (data.polling?.should_continue && attempts < maxAttempts) {
        const interval = data.polling.interval_seconds * 1000
        console.log(`🔄 Transaction polling continues in ${data.polling.interval_seconds}s`)
        
        timeoutRef.current = setTimeout(() => {
          setAttempts(prev => prev + 1)
          pollTransactionStatus(transactionId)
        }, interval)
      } else {
        console.log('🛑 Transaction polling stopped')
        stopMonitoring()
      }

    } catch (error) {
      console.error('❌ Error polling transaction status:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      // Retry with longer interval on error
      if (attempts < maxAttempts) {
        timeoutRef.current = setTimeout(() => {
          setAttempts(prev => prev + 1)
          pollTransactionStatus(transactionId)
        }, 10000)
      } else {
        stopMonitoring()
      }
    }
  }

  /**
   * Poll client transactions for dashboard updates
   */
  const pollClientTransactions = async (clientId: string, deviceIds: string[] = []) => {
    try {
      const params: any = {
        since: lastUpdate
      }

      if (deviceIds.length > 0) {
        params.device_id = deviceIds.join(',')
      }

      const response = await paybillApi.pollTransactionStatus(parseInt(clientId), params)
      console.log(`📊 Client ${clientId} poll result:`, response)

      const data = response

      if (data.success && data.has_updates) {
        // Update last update timestamp
        setLastUpdate(data.poll_timestamp)

        // Process each transaction update
        data.transactions?.forEach((transaction: PaybillTransaction & { is_new: boolean; is_updated: boolean }) => {
          if (transaction.is_new) {
            console.log('🆕 New transaction detected:', transaction)
            options.onTransactionFound?.({
              transaction,
              type: 'dashboard_new'
            })
          }

          if (transaction.is_updated) {
            console.log('🔄 Transaction updated:', transaction)
            
            if (transaction.status === 'processed' && transaction.credited_to_account) {
              options.onTransactionSuccess?.({
                transaction,
                message: 'Payment processed successfully!'
              })
            } else if (['failed', 'rejected'].includes(transaction.status)) {
              options.onTransactionFailed?.({
                transaction,
                reason: transaction.processing_notes || 'Payment failed'
              })
            }
          }
        })
      }

      // Continue polling based on server recommendation
      if (data.polling?.should_continue) {
        const interval = data.polling.interval_seconds * 1000
        console.log(`🔄 Dashboard polling continues in ${data.polling.interval_seconds}s`)
        
        timeoutRef.current = setTimeout(() => {
          pollClientTransactions(clientId, deviceIds)
        }, interval)
      } else {
        console.log('🛑 Dashboard polling stopped (no active transactions)')
        stopMonitoring()
      }

    } catch (error) {
      console.error('❌ Error polling client transactions:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      // Retry with longer interval on error
      timeoutRef.current = setTimeout(() => {
        pollClientTransactions(clientId, deviceIds)
      }, 15000)
    }
  }

  /**
   * Stop all monitoring activities
   */
  const stopMonitoring = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    setIsMonitoring(false)
    setAttempts(0)
    
    console.log('🛑 Monitoring stopped')
    options.onPollingStopped?.()
  }, [options])

  return {
    isMonitoring,
    currentTransaction,
    lastUpdate,
    attempts,
    error,
    startDeviceMonitoring,
    startTransactionMonitoring,
    startDashboardMonitoring,
    stopMonitoring
  }
} 