import { Field } from 'payload'

export const EmployeeFields = (prefix: string = 'employee', path: string = prefix): Field[] => [
  {
    type: 'text',
    name: `${prefix}_name`,
    label: 'Name',
    admin: { hidden: true },

    virtual: `${path}.full_name`,
  },
  {
    type: 'text',
    name: `${prefix}_h2a_id`,
    label: 'Employee H2A ID',
    admin: { hidden: true },

    virtual: `${path}.h2a_oasys_emp_id`,
  },
  {
    type: 'text',
    name: `${prefix}_designation`,
    label: 'Designation',
    admin: { hidden: true },

    virtual: `${path}.designation`,
  },
  {
    type: 'text',
    name: `${prefix}_department_name`,
    label: 'Department Name',
    admin: { hidden: true },

    virtual: `${path}.department.title`,
  },
  {
    type: 'text',
    name: `${prefix}_operator_name`,
    label: 'Operator Name',
    admin: { hidden: true },

    virtual: `${path}.operator.title`,
  },
  {
    type: 'email',
    name: `${prefix}_email`,
    label: 'Email',
    admin: { hidden: true },

    virtual: `${path}.email`,
  },
  {
    type: 'date',
    name: `${prefix}_doj`,
    label: 'Date of Joining',
    admin: { hidden: true },

    virtual: `${path}.doj`,
  },
]
