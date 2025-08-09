import { createClient } from "./client"

// Simple in-memory cache for Supabase queries
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class QueryCache {
  constructor() {
    this.cache = new Map()
  }

  generateKey(table, query) {
    return `${table}:${JSON.stringify(query)}`
  }

  get(key) {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  invalidate(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }
}

export const queryCache = new QueryCache()

// Optimized Supabase client with caching
export class OptimizedClient {
  constructor() {
    this.supabase = createClient()
  }

  async query(table, query = {}) {
    const key = queryCache.generateKey(table, query)
    const cached = queryCache.get(key)
    
    if (cached) {
      return { data: cached, error: null }
    }

    let result = this.supabase.from(table).select('*')
    
    // Apply query filters
    if (query.eq) {
      Object.entries(query.eq).forEach(([column, value]) => {
        result = result.eq(column, value)
      })
    }
    
    if (query.gte) {
      Object.entries(query.gte).forEach(([column, value]) => {
        result = result.gte(column, value)
      })
    }
    
    if (query.lte) {
      Object.entries(query.lte).forEach(([column, value]) => {
        result = result.lte(column, value)
      })
    }
    
    if (query.order) {
      const [column, ascending = true] = query.order
      result = result.order(column, { ascending })
    }
    
    if (query.limit) {
      result = result.limit(query.limit)
    }

    const { data, error } = await result
    
    if (!error && data) {
      queryCache.set(key, data)
    }
    
    return { data, error }
  }

  async mutate(table, operation, data) {
    // Invalidate cache on mutations
    queryCache.invalidate(table)
    
    switch (operation) {
      case 'insert':
        return this.supabase.from(table).insert(data)
      case 'update':
        return this.supabase.from(table).update(data).eq('id', data.id)
      case 'delete':
        return this.supabase.from(table).delete().eq('id', data.id)
      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }
  }
}

// Export singleton instance
export const optimizedClient = new OptimizedClient()

// Helper functions for common queries
export async function getExpenses(userId, startDate, endDate) {
  return optimizedClient.query('expenses', {
    eq: { user_id: userId },
    gte: { spent_at: startDate },
    lte: { spent_at: endDate },
    order: ['spent_at', false]
  })
}

export async function getBudget(userId, month) {
  return optimizedClient.query('budgets', {
    eq: { user_id: userId, month }
  })
}

export async function getExpensesByCategory(userId, startDate, endDate) {
  const { data, error } = await optimizedClient.query('expenses', {
    eq: { user_id: userId },
    gte: { spent_at: startDate },
    lte: { spent_at: endDate }
  })
  
  if (error) return { data: null, error }
  
  // Aggregate by category
  const categoryTotals = data.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {})
  
  return { data: categoryTotals, error: null }
}