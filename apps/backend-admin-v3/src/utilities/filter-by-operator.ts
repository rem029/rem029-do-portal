import type { FilterOptions } from 'payload'

export const filterByOperator: FilterOptions = ({ data }) => {
  const operator = data?.operator
  if (operator) {
    return {
      operator: {
        equals: typeof operator === 'object' ? operator.id : operator,
      },
    }
  }
  return false
}
