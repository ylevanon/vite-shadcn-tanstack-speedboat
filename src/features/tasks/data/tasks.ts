import { faker } from '@faker-js/faker'

// Set a fixed seed for consistent data generation
faker.seed(12345)

export const tasks = Array.from({ length: 100 }, () => {
  const statuses = [
    'todo',
    'in progress',
    'done',
    'canceled',
    'backlog',
  ] as const
  const labels = ['bug', 'feature', 'documentation'] as const
  const priorities = ['low', 'medium', 'high', 'critical'] as const
  const createdAt = faker.date.recent({ days: 90 })
  const isOverdue = faker.number.float({ min: 0, max: 1 }) < 0.25
  const dueDate = isOverdue
    ? faker.date.recent({ days: 14, refDate: new Date() })
    : faker.date.soon({ days: 30, refDate: new Date() })
  const status = faker.helpers.arrayElement(statuses)

  return {
    id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
    title: faker.lorem.sentence({ min: 5, max: 15 }),
    status,
    label: faker.helpers.arrayElement(labels),
    priority: faker.helpers.arrayElement(priorities),
    createdAt,
    updatedAt: faker.date.recent(),
    assignee: faker.person.fullName(),
    description: faker.lorem.paragraph({ min: 1, max: 3 }),
    dueDate:
      status === 'done' || status === 'canceled'
        ? faker.date.soon({ days: 20, refDate: createdAt })
        : dueDate,
  }
})
