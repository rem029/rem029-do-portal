export enum OasysH2AInfo {
  EMPLOYEE_INFO = 7,
  DOJ_DOL = 8,
  BUDGET = 9,
  PROBATION = 10,
  ON_LEAVE_HISTORY = 11,
  ON_LEAVE = 12,
}

export interface OasysH2ATokenRequest {
  clientId: string
  secret: string
  baseUrl: string
}

export interface OasysH2ATokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface OasysH2AInfoParam {
  divisionId: string
  id: OasysH2AInfo
  token: string
  baseUrl: string
  additionalParams?: any
}

export type OasysH2AGroupedByDivision = Record<string, OasysH2AEmployeeData[]>
export interface OasysH2AEmployeeData {
  'E.N'?: string
  NAME?: string
  DOJ?: string
  'END OF PROBATION'?: string
  GRADE?: string
  DESIGNATION?: string
  'Sub Department'?: string
  DEPARTMENT?: string
  'REPORTING MANAGER'?: string
  'WORK DAYS/WEEK'?: string
  'DATE OF BIRTH'?: string
  AGE?: number
  NATIONALITY?: string
  'PERSONAL CONTACT NO.'?: string
  'OFFICE NO.'?: string
  'PERSONAL EMAIL'?: string
  'COMPANY EMAIL'?: string
  'QID NUMBER'?: string
  'QID EXPIRE DATE'?: string
  'TICKET ENTITLEMENT'?: string
  'ACCOMMODATION DETAILS'?: string
  GENDER?: string
  'SOCIAL STATUS OF CONTRACTS'?: string
  'FAMILY STATUS'?: string
  'Hamad Card Staff'?: string
  'Hamad Card Expiry Date'?: string
  'Hamad Card Family'?: string
  'Private HEALTH INSURANCE (Employee)'?: string
  'Private Health Insurance Family (if eligible)'?: string
  'Age Group'?: string
  Religion?: string
  CAT?: string
  Comments?: string
  'Staff ID'?: string
  HRA?: string
}
