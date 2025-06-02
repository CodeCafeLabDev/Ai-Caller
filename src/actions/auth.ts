
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbConnection } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// const signUpSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(6),
// });

const signInSchema = z.object({
  user_Id: z.string().min(1, { message: "User ID is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// export async function signUpUserAction(values: z.infer<typeof signUpSchema>) {
//   try {
//     const validatedFields = signUpSchema.safeParse(values);
//     if (!validatedFields.success) {
//       return { success: false, message: 'Invalid input.' };
//     }

//     const { email, password } = validatedFields.data;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const connection = await getDbConnection();

//     try {
//       const [existingUser] = await connection.execute<RowDataPacket[]>(
//         'SELECT email FROM users WHERE email = ?',
//         [email]
//       );
//       if (existingUser.length > 0) {
//         return { success: false, message: 'Email already exists.' };
//       }

//       await connection.execute(
//         'INSERT INTO users (email, password) VALUES (?, ?)',
//         [email, hashedPassword]
//       );
//       return { success: true, message: 'Sign up successful! Please sign in.' };
//     } catch (dbError) {
//       console.error('Database error during sign up:', dbError);
//       return { success: false, message: 'An error occurred. Please try again.' };
//     }
//   } catch (error) {
//     console.error('Sign up action error:', error);
//     return { success: false, message: 'An unexpected error occurred.' };
//   }
// }

export async function signInUserAction(values: z.infer<typeof signInSchema>) {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.' };
    }

    const { user_Id, password } = validatedFields.data;
    const connection = await getDbConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT user_Id, password FROM Login WHERE user_Id = ?',
        [user_Id]
      );

      if (rows.length === 0) {
        return { success: false, message: 'Invalid User ID or password.' };
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return { success: false, message: 'Invalid User ID or password.' };
      }

      // In a real app, you'd create a session/JWT here
      return {
        success: true,
        message: 'Sign in successful!',
        user: { userId: user.user_Id }, // Changed from id and email
      };
    } catch (dbError) {
      console.error('Database error during sign in:', dbError);
      return { success: false, message: 'An error occurred. Please try again.' };
    }
  } catch (error) {
    console.error('Sign in action error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

