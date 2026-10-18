'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getDb } from './db'
import { BOOK_STATUSES } from './definitions'

// Mutation pattern (Next.js Learn, chapters 11-13): validate FormData with Zod safeParse and
// return field errors for useActionState, write to the database inside try/catch, then call
// revalidatePath() and redirect() after the try/catch.

const CreateBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title')
    .max(200, 'Title must be 200 characters or fewer'),
  author: z
    .string()
    .trim()
    .min(1, 'Enter an author')
    .max(100, 'Author must be 100 characters or fewer'),
  status: z.enum(BOOK_STATUSES, { error: 'Choose a status' }).default('want_to_read'),
})

export type CreateBookState = {
  errors?: { title?: string[]; author?: string[]; status?: string[] }
  message?: string | null
  values?: { title: string; author: string; status: string }
}

function field(formData: FormData, name: string): string | null {
  const value = formData.get(name)
  return typeof value === 'string' ? value : null
}

export async function createBook(
  _prevState: CreateBookState,
  formData: FormData,
): Promise<CreateBookState> {
  const status = field(formData, 'status')
  const values = {
    title: field(formData, 'title') ?? '',
    author: field(formData, 'author') ?? '',
    status: status ?? '',
  }

  // A missing status field is null; map it to undefined so the schema default applies.
  const validatedFields = CreateBookSchema.safeParse({
    title: values.title,
    author: values.author,
    status: status ?? undefined,
  })

  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      message: 'Fix the highlighted fields.',
      values,
    }
  }

  const { title, author, status: bookStatus } = validatedFields.data

  try {
    getDb()
      .prepare('INSERT INTO books (title, author, status) VALUES (?, ?, ?)')
      .run(title, author, bookStatus)
  } catch (error) {
    console.error('Database error:', error)
    return { message: 'Could not add the book. Please try again.', values }
  }

  revalidatePath('/')
  redirect('/')
}

const UpdateStatusSchema = z.object({
  status: z.enum(BOOK_STATUSES, { error: 'Choose a status' }),
})

export type StatusState = { message?: string | null }

export async function updateBookStatus(
  id: number,
  _prevState: StatusState,
  formData: FormData,
): Promise<StatusState> {
  const validatedFields = UpdateStatusSchema.safeParse({ status: formData.get('status') })

  if (!validatedFields.success) {
    return { message: 'Choose a status' }
  }

  try {
    const result = getDb()
      .prepare('UPDATE books SET status = ? WHERE id = ?')
      .run(validatedFields.data.status, id)
    if (result.changes === 0) return { message: 'This book no longer exists.' }
  } catch (error) {
    console.error('Database error:', error)
    return { message: 'Could not save the status. Please try again.' }
  }

  revalidatePath('/')
  return { message: null }
}
