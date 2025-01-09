import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { clerkClient, WebhookEvent } from '@clerk/nextjs/server';
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.actions';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    console.error('Error: Missing SIGNING_SECRET environment variable');
    return new Response('Error: Missing server configuration', { status: 500 });
  }

  const wh = new Webhook(SIGNING_SECRET);

  const headerPayload = Object.fromEntries(await headers());
  const svix_id = headerPayload['svix-id'];
  const svix_timestamp = headerPayload['svix-timestamp'];
  const svix_signature = headerPayload['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', { status: 400 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('Error: Invalid JSON payload:', err);
    return new Response('Error: Invalid JSON payload', { status: 400 });
  }

  const body = JSON.stringify(payload);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error: Webhook verification failed');
    return new Response('Error: Verification error', { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (!id) {
    return new Response('Error: Missing user ID', { status: 400 });
  }

  if (eventType === 'user.created') {
    const { email_addresses, image_url, first_name, last_name, username } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return new Response('Error: Missing email address', { status: 400 });
    }

    const user = {
      clerkId: id,
      email,
      username: username ?? '',
      firstName: first_name ?? '',
      lastName: last_name ?? '',
      photo: image_url,
    };

    const newUser = await createUser(user);

    if (newUser) {
      try {
        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser._id,
          },
        });
      } catch (err) {
        console.error('Error updating Clerk user metadata:', err);
        return new Response('Error updating user metadata', { status: 500 });
      }
    }

    return NextResponse.json({ message: 'OK', user: newUser });
  }

  if (eventType === 'user.updated') {
    const { image_url, first_name, last_name, username } = evt.data;

    const user = {
      firstName: first_name ?? '',
      lastName: last_name ?? '',
      username: username ?? '',
      photo: image_url,
    };

    const updatedUser = await updateUser(id, user);

    return NextResponse.json({ message: 'OK', user: updatedUser });
  }

  if (eventType === 'user.deleted') {
    const deletedUser = await deleteUser(id);

    return NextResponse.json({ message: 'OK', user: deletedUser });
  }

  return new Response(`Unhandled event type: ${eventType}`, { status: 400 });
}
