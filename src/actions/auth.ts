
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDbConnection } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

const signInSchema = z.object({
  user_Id: z.string().min(1, { message: "User ID is required." }), // Will map to user_identifier
  password: z.string().min(1, { message: "Password is required." }),
});

export async function signInUserAction(values: z.infer<typeof signInSchema>) {
  try {
    const validatedFields = signInSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid input.', user: null };
    }

    const { user_Id: userIdentifier, password: inputPassword } = validatedFields.data;

    const db = await getDbConnection();
    // Query the new Users table and select password_hash
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT user_identifier, password_hash FROM Users WHERE user_identifier = ?',
      [userIdentifier]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Invalid User ID or password.', user: null };
    }

    const userFromDb = rows[0];
    // Access the stored hash from password_hash column
    const storedPasswordHash = userFromDb.password_hash; 

    const passwordMatches = await bcrypt.compare(inputPassword, storedPasswordHash);

    if (!passwordMatches) {
      return { success: false, message: 'Invalid User ID or password.', user: null };
    }

    // Role determination (current limitation: based on known test user_identifiers)
    // This will be enhanced once Roles and UserRoles tables are fully integrated.
    let userRole: string | null = null;
    let successMessage: string = 'Sign in successful!';

    if (userIdentifier === 'testUser') {
      userRole = 'super_admin';
      successMessage = 'Sign in successful! (Super Admin)';
    } else if (userIdentifier === 'clientTestUser') {
      userRole = 'client_admin';
      successMessage = 'Sign in successful! (Client Admin)';
    } else {
      // For other DB users, role needs to be fetched from UserRoles table eventually
      // For now, if they exist in Users and password matches, but aren't the test users,
      // we can acknowledge authentication but not assign a specific app role yet.
      console.warn(`User '${userIdentifier}' authenticated but role determination via UserRoles table is not yet implemented.`);
      successMessage = `User '${userIdentifier}' authenticated. Role assignment pending full implementation.`;
      // To prevent login without a known role for now, let's consider this a setup phase.
      // You might want to allow login and assign a default "user" role if one exists in your future Roles table.
       return { 
        success: false, // Or true, if you want to allow login with a generic role
        message: 'User authenticated, but role determination is not fully configured for this user type.', 
        user: { userId: userIdentifier, role: 'unknown' } // Or null
      };
    }

    return {
      success: true,
      message: successMessage,
      user: { userId: userIdentifier, role: userRole },
    };

  } catch (error)
 {
    console.error('Sign in action error:', error);
    if (error instanceof Error && error.message.includes('connect ECONNREFUSED')) {
        return { success: false, message: 'Database connection failed. Please ensure the database server is running and accessible.', user: null };
    }
    return { success: false, message: 'An unexpected error occurred during sign in.', user: null };
  }
}
