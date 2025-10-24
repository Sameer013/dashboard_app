'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });


// Define Zod schema for invoice form data validation
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid','pending']),
    date: z.string(),
});


//Using Zod to create schemas for Create and Update actions
const CreateInvoice = FormSchema.omit({id: true, date: true});
const UpdateInvoice = FormSchema.omit({ id: true, date: true});



// Create Invoice Action
export async function createInvoice(formData: FormData){
    const { customerId, amount, status} = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    
    const date = new Date().toISOString().split('T')[0];
    try {

        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        console.error(error);
        throw new Error('Database error: Failed to Create Invoice');
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

// Update Invoice Action
export async function updateInvoice(id: string,formData: FormData){
    const { customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    
    try {

        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
        `;
    } catch (error){
        console.error(error);
        throw new Error('Database error: Failed to Update Invoice');
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

// Delete Invoice Action
export async function deleteInvoice(id: string) {
    try{

        await sql`
        DELETE FROM invoices WHERE id = ${id}`;
    }  catch (error){
        console.error(error);
        throw new Error('Database error: Failed to Delete Invoice');
    }

    revalidatePath('/dashboard/invoices');
}
