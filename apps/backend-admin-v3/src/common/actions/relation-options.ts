'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { getSurveyDepartmentOptions, type SurveyDepartmentOption } from '@/utilities/survey-department'

async function fetchRelationOptions(collection: 'operators' | 'restaurants' | 'store-departments' | 'departments' | 'crm-categories') {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({ collection, limit: 1000, overrideAccess: true, depth: 0 })
    return { success: true, data: docs.map((doc) => ({ id: doc.id, title: (doc as { title?: string }).title })) }
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error)
    return { success: false, data: [] }
  }
}

export async function getOperatorsAction() {
  return fetchRelationOptions('operators')
}

export async function getRestaurantsAction() {
  return fetchRelationOptions('restaurants')
}

export async function getStoreDepartmentsAction() {
  return fetchRelationOptions('store-departments')
}

export async function getDepartmentsAction() {
  return fetchRelationOptions('departments')
}

export async function getCrmCategoriesAction() {
  return fetchRelationOptions('crm-categories')
}

export async function getSurveyDepartmentOptionsAction(
  formId: string,
): Promise<{ success: boolean; data: SurveyDepartmentOption[] }> {
  try {
    const payload = await getPayload({ config: configPromise })
    const form = await payload.findByID({ collection: 'forms', id: formId, overrideAccess: true, depth: 0 })
    return { success: true, data: await getSurveyDepartmentOptions(payload, form) }
  } catch (error) {
    console.error('Error fetching survey department options:', error)
    return { success: false, data: [] }
  }
}
