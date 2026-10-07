'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export interface EmployeeHistoryItem {
  id: string
  subject: string
  workflow_status: string
  createdAt: string
  collection: string
  userName: string
  userEmail: string
  lastComment?: string
  reviewedBy?: string
  days_deducted?: number
}

export interface UserOption {
  label: string
  value: string
}

/**
 * Collection configuration with user field mapping
 * Each collection may use different field names to reference the user
 */
interface CollectionConfig {
  slug: string
  userField: string // Field name that references the user (e.g., 'user', 'created_by', 'requestor')
  fields: string[]
}

/**
 * Fetch all users from the users collection
 */
export async function fetchAllUsers(): Promise<UserOption[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'users',
      limit: 1000,
      depth: 0,
      sort: 'full_name',
    })

    return result.docs.map((user) => ({
      label: `${user.full_name || 'N/A'} (${user.email})`,
      value: user.id,
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

/**
 * Fetch employee history for a given user (or all recent data if no userId)
 * Extensible: Add more collections by adding to the collections array
 */
export async function fetchEmployeeHistory(
  userId?: string,
  fromDate?: string,
  toDate?: string,
): Promise<EmployeeHistoryItem[]> {
  try {
    const payload = await getPayload({ config })
    const allItems: EmployeeHistoryItem[] = []

    // Define collections to fetch with their respective user field names
    const collections: CollectionConfig[] = [
      {
        slug: 'disciplinary-actions',
        userField: 'employee',
        fields: ['subject', 'workflow_status', 'createdAt', 'days_deducted', 'workflow_reviews'],
      },
    ]

    // Fetch from each collection
    for (const { slug, userField } of collections) {
      try {
        // Build where clause
        const where: any = {
          and: [],
        }

        if (userId) {
          where.and.push({
            [userField]: {
              equals: userId,
            },
          })
        }

        if (fromDate) {
          where.and.push({
            createdAt: {
              greater_than_equal: fromDate,
            },
          })
        }

        if (toDate) {
          // Add 23:59:59 to toDate if it's just a date string to include the whole day
          const endOfDay = toDate.includes('T') ? toDate : `${toDate}T23:59:59.999Z`
          where.and.push({
            createdAt: {
              less_than_equal: endOfDay,
            },
          })
        }

        // Clean up where clause if no filters are applied
        const finalWhere = where.and.length > 0 ? where : {}

        const result = await payload.find({
          collection: slug as any,
          where: finalWhere,
          limit: userId || fromDate || toDate ? 100 : 50, // Increase limit if filters are used
          depth: 1, // Depth 1 to populate user relationships
          sort: '-createdAt',
        })

        const items = await Promise.all(
          result.docs.map(async (doc: any) => {
            // Get user data based on the userField for this collection
            const userData = doc[userField]
            let user = null

            if (typeof userData === 'object' && userData !== null) {
              // User data is already populated
              user = userData
            } else if (typeof userData === 'string') {
              // User data is just an ID, fetch the user
              try {
                user = await payload.findByID({
                  collection: 'users',
                  id: userData,
                  depth: 0,
                })
              } catch (error) {
                console.error(`Error fetching user ${userData}:`, error)
              }
            }

            // Extract last comment and reviewer from workflow_reviews
            // Find the latest review that has a response (is not pending)
            const reviews = doc.workflow_reviews || []
            const completedReviews = [...reviews]
              .filter((r: any) => r.response && r.response !== 'pending')
              .sort(
                (a: any, b: any) =>
                  new Date(b.reviewed_at || 0).getTime() - new Date(a.reviewed_at || 0).getTime(),
              )

            const lastReview = completedReviews[0]

            return {
              id: doc.id,
              subject: doc.subject || 'N/A',
              workflow_status: doc.workflow_status || 'N/A',
              createdAt: doc.createdAt,
              collection: slug,
              userName: user?.full_name || 'N/A',
              userEmail: user?.email || 'N/A',
              days_deducted: doc.days_deducted,
              lastComment: lastReview?.comments,
              reviewedBy: lastReview?.reviewed_by,
            }
          }),
        )

        allItems.push(...items)
      } catch (error) {
        console.error(`Error fetching from ${slug}:`, error)
        // Continue with other collections even if one fails
      }
    }

    // Sort all items by createdAt (newest first)
    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // If no user selected, limit total results to most recent 100
    if (!userId && allItems.length > 100) {
      return allItems.slice(0, 100)
    }

    return allItems
  } catch (error) {
    console.error('Error fetching employee history:', error)
    return []
  }
}
