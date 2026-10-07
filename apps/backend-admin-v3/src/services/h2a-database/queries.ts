/* eslint-disable @typescript-eslint/no-explicit-any */
import { getH2ADbPool } from './db'
import { OasysH2AEmployeeData } from '@/services/h2a-oasys/types'

export const findEmployeeById = async (
  employeeId: string,
): Promise<OasysH2AEmployeeData | null> => {
  const pool = getH2ADbPool()
  const result = await pool.query('SELECT raw_data FROM employee_info WHERE en = $1', [employeeId])
  if (result.rows.length === 0) return null
  return result.rows[0].raw_data as OasysH2AEmployeeData
}

export const findEmployeeByEmail = async (email: string): Promise<OasysH2AEmployeeData | null> => {
  const pool = getH2ADbPool()
  const normalizedEmail = email.toLowerCase()
  const result = await pool.query(
    'SELECT raw_data FROM employee_info WHERE LOWER(company_email) = $1 OR LOWER(personal_email) = $1',
    [normalizedEmail],
  )
  if (result.rows.length === 0) return null
  return result.rows[0].raw_data as OasysH2AEmployeeData
}

export const upsertEmployeeInfo = async (
  divisionId: string,
  emp: OasysH2AEmployeeData,
): Promise<void> => {
  const pool = getH2ADbPool()
  const en = emp['E.N'] || ''
  if (!en) return

  await pool.query(
    `INSERT INTO employee_info (
      en, division_id, name, doj, end_of_probation, grade, designation,
      sub_department, department, reporting_manager, work_days_week,
      date_of_birth, age, nationality, personal_contact_no, office_no,
      personal_email, company_email, qid_number, qid_expire_date,
      ticket_entitlement, accommodation_details, gender,
      social_status_of_contracts, family_status, hamad_card_staff,
      hamad_card_expiry_date, hamad_card_family, private_health_insurance_employee,
      private_health_insurance_family, age_group, religion, cat, comments,
      staff_id, hra, raw_data, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36, $37, NOW()
    )
    ON CONFLICT (en) DO UPDATE SET
      division_id = EXCLUDED.division_id,
      name = EXCLUDED.name,
      doj = EXCLUDED.doj,
      end_of_probation = EXCLUDED.end_of_probation,
      grade = EXCLUDED.grade,
      designation = EXCLUDED.designation,
      sub_department = EXCLUDED.sub_department,
      department = EXCLUDED.department,
      reporting_manager = EXCLUDED.reporting_manager,
      work_days_week = EXCLUDED.work_days_week,
      date_of_birth = EXCLUDED.date_of_birth,
      age = EXCLUDED.age,
      nationality = EXCLUDED.nationality,
      personal_contact_no = EXCLUDED.personal_contact_no,
      office_no = EXCLUDED.office_no,
      personal_email = EXCLUDED.personal_email,
      company_email = EXCLUDED.company_email,
      qid_number = EXCLUDED.qid_number,
      qid_expire_date = EXCLUDED.qid_expire_date,
      ticket_entitlement = EXCLUDED.ticket_entitlement,
      accommodation_details = EXCLUDED.accommodation_details,
      gender = EXCLUDED.gender,
      social_status_of_contracts = EXCLUDED.social_status_of_contracts,
      family_status = EXCLUDED.family_status,
      hamad_card_staff = EXCLUDED.hamad_card_staff,
      hamad_card_expiry_date = EXCLUDED.hamad_card_expiry_date,
      hamad_card_family = EXCLUDED.hamad_card_family,
      private_health_insurance_employee = EXCLUDED.private_health_insurance_employee,
      private_health_insurance_family = EXCLUDED.private_health_insurance_family,
      age_group = EXCLUDED.age_group,
      religion = EXCLUDED.religion,
      cat = EXCLUDED.cat,
      comments = EXCLUDED.comments,
      staff_id = EXCLUDED.staff_id,
      hra = EXCLUDED.hra,
      raw_data = EXCLUDED.raw_data,
      updated_at = NOW()`,
    [
      en,
      divisionId,
      emp['NAME'] || null,
      emp['DOJ'] || null,
      emp['END OF PROBATION'] || null,
      emp['GRADE'] || null,
      emp['DESIGNATION'] || null,
      emp['Sub Department'] || null,
      emp['DEPARTMENT'] || null,
      emp['REPORTING MANAGER'] || null,
      emp['WORK DAYS/WEEK'] || null,
      emp['DATE OF BIRTH'] || null,
      emp['AGE'] || null,
      emp['NATIONALITY'] || null,
      emp['PERSONAL CONTACT NO.'] || null,
      emp['OFFICE NO.'] || null,
      emp['PERSONAL EMAIL'] || null,
      emp['COMPANY EMAIL'] || null,
      emp['QID NUMBER'] || null,
      emp['QID EXPIRE DATE'] || null,
      emp['TICKET ENTITLEMENT'] || null,
      emp['ACCOMMODATION DETAILS'] || null,
      emp['GENDER'] || null,
      emp['SOCIAL STATUS OF CONTRACTS'] || null,
      emp['FAMILY STATUS'] || null,
      emp['Hamad Card Staff'] || null,
      emp['Hamad Card Expiry Date'] || null,
      emp['Hamad Card Family'] || null,
      emp['Private HEALTH INSURANCE (Employee)'] || null,
      emp['Private Health Insurance Family (if eligible)'] || null,
      emp['Age Group'] || null,
      emp['Religion'] || null,
      emp['CAT'] || null,
      emp['Comments'] || null,
      emp['Staff ID'] || null,
      emp['HRA'] || null,
      JSON.stringify(emp),
    ],
  )
}

export const upsertEmployeeDoj = async (divisionId: string, emp: any): Promise<void> => {
  const pool = getH2ADbPool()
  const en = emp['E.N'] || ''
  if (!en) return

  await pool.query(
    `INSERT INTO employee_doj (en, division_id, raw_data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (en) DO UPDATE SET
       division_id = EXCLUDED.division_id,
       raw_data = EXCLUDED.raw_data,
       updated_at = NOW()`,
    [en, divisionId, JSON.stringify(emp)],
  )
}

export const upsertEmployeeBudget = async (divisionId: string, emp: any): Promise<void> => {
  const pool = getH2ADbPool()
  const en = emp['E.N'] || ''
  if (!en) return

  await pool.query(
    `INSERT INTO employee_budget (en, division_id, raw_data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (en) DO UPDATE SET
       division_id = EXCLUDED.division_id,
       raw_data = EXCLUDED.raw_data,
       updated_at = NOW()`,
    [en, divisionId, JSON.stringify(emp)],
  )
}

export const upsertEmployeeProbation = async (divisionId: string, emp: any): Promise<void> => {
  const pool = getH2ADbPool()
  const en = emp['E.N'] || ''
  if (!en) return

  await pool.query(
    `INSERT INTO employee_probation (en, division_id, raw_data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (en) DO UPDATE SET
       division_id = EXCLUDED.division_id,
       raw_data = EXCLUDED.raw_data,
       updated_at = NOW()`,
    [en, divisionId, JSON.stringify(emp)],
  )
}

export const upsertEmployeeOnLeave = async (divisionId: string, emp: any): Promise<void> => {
  const pool = getH2ADbPool()
  const en = emp['E.N'] || ''
  if (!en) return

  await pool.query(
    `INSERT INTO employee_on_leave (en, division_id, raw_data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (en) DO UPDATE SET
       division_id = EXCLUDED.division_id,
       raw_data = EXCLUDED.raw_data,
       updated_at = NOW()`,
    [en, divisionId, JSON.stringify(emp)],
  )
}

export const insertEmployeeOnLeaveHistory = async (divisionId: string, emp: any): Promise<void> => {
  const pool = getH2ADbPool()
  const en = emp['E.N'] || ''
  if (!en) return

  await pool.query(
    `INSERT INTO employee_on_leave_history (en, division_id, raw_data, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [en, divisionId, JSON.stringify(emp)],
  )
}

export const deleteOnLeaveHistoryByDivision = async (divisionId: string): Promise<void> => {
  const pool = getH2ADbPool()
  await pool.query('DELETE FROM employee_on_leave_history WHERE division_id = $1', [divisionId])
}

export const findAllEmployees = async (): Promise<OasysH2AEmployeeData[]> => {
  const pool = getH2ADbPool()
  const result = await pool.query('SELECT raw_data FROM employee_info ORDER BY name ASC')
  return result.rows.map((row) => row.raw_data as OasysH2AEmployeeData)
}

export const findEmployeesByDivision = async (
  divisionId: string,
): Promise<OasysH2AEmployeeData[]> => {
  const pool = getH2ADbPool()
  const result = await pool.query(
    'SELECT raw_data FROM employee_info WHERE division_id = $1 ORDER BY name ASC',
    [divisionId],
  )
  return result.rows.map((row) => row.raw_data as OasysH2AEmployeeData)
}
