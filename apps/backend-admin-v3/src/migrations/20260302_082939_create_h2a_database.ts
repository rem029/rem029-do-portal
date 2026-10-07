import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { getH2ADbPool } from '@/services/h2a-database'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const pool = getH2ADbPool()
  const client = await pool.connect()
  try {
    payload.logger.info('Creating H2A database schema...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_info (
        id SERIAL PRIMARY KEY,
        en VARCHAR(255) NOT NULL UNIQUE,
        division_id VARCHAR(255),
        name VARCHAR(500),
        doj VARCHAR(100),
        end_of_probation VARCHAR(100),
        grade VARCHAR(100),
        designation VARCHAR(500),
        sub_department VARCHAR(500),
        department VARCHAR(500),
        reporting_manager VARCHAR(500),
        work_days_week VARCHAR(50),
        date_of_birth VARCHAR(100),
        age INTEGER,
        nationality VARCHAR(255),
        personal_contact_no VARCHAR(100),
        office_no VARCHAR(100),
        personal_email VARCHAR(500),
        company_email VARCHAR(500),
        qid_number VARCHAR(100),
        qid_expire_date VARCHAR(100),
        ticket_entitlement VARCHAR(255),
        accommodation_details TEXT,
        gender VARCHAR(50),
        social_status_of_contracts VARCHAR(255),
        family_status VARCHAR(255),
        hamad_card_staff VARCHAR(50),
        hamad_card_expiry_date VARCHAR(100),
        hamad_card_family VARCHAR(50),
        private_health_insurance_employee VARCHAR(255),
        private_health_insurance_family VARCHAR(255),
        age_group VARCHAR(100),
        religion VARCHAR(100),
        cat VARCHAR(100),
        comments TEXT,
        staff_id VARCHAR(100),
        hra VARCHAR(100),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employee_info_company_email_lower
        ON employee_info (LOWER(company_email))
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employee_info_personal_email_lower
        ON employee_info (LOWER(personal_email))
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_doj (
        id SERIAL PRIMARY KEY,
        en VARCHAR(255) NOT NULL UNIQUE,
        division_id VARCHAR(255),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_budget (
        id SERIAL PRIMARY KEY,
        en VARCHAR(255) NOT NULL UNIQUE,
        division_id VARCHAR(255),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_probation (
        id SERIAL PRIMARY KEY,
        en VARCHAR(255) NOT NULL UNIQUE,
        division_id VARCHAR(255),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_on_leave (
        id SERIAL PRIMARY KEY,
        en VARCHAR(255) NOT NULL UNIQUE,
        division_id VARCHAR(255),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_on_leave_history (
        id SERIAL PRIMARY KEY,
        en VARCHAR(255) NOT NULL,
        division_id VARCHAR(255),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    payload.logger.info('H2A database schema created successfully.')
  } finally {
    client.release()
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  const pool = getH2ADbPool()
  const client = await pool.connect()
  try {
    payload.logger.info('Dropping H2A database schema...')
    await client.query('DROP TABLE IF EXISTS employee_on_leave_history CASCADE')
    await client.query('DROP TABLE IF EXISTS employee_on_leave CASCADE')
    await client.query('DROP TABLE IF EXISTS employee_probation CASCADE')
    await client.query('DROP TABLE IF EXISTS employee_budget CASCADE')
    await client.query('DROP TABLE IF EXISTS employee_doj CASCADE')
    await client.query('DROP TABLE IF EXISTS employee_info CASCADE')
    payload.logger.info('H2A database schema dropped.')
  } finally {
    client.release()
  }
}
