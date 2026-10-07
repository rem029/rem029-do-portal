'use client'

import { createContext, useContext } from 'react'

// Lets deeply nested fields (e.g. survey-department) reach the form id without prop drilling.
export const FormIdContext = createContext<string>('')

export const useFormId = () => useContext(FormIdContext)

// Department locked by a survey invitation (Phase 7b); undefined for untagged codes and non-surveys.
export const LockedDepartmentContext = createContext<string | undefined>(undefined)

export const useLockedDepartment = () => useContext(LockedDepartmentContext)
