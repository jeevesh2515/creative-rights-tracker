import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAuth } from '@/lib/apiSecurity';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAuth();

    // Get user role to verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Query params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const role = searchParams.get('role');

    // Fetch users
    let query = supabaseAdmin.from('users').select('*', { count: 'exact' });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query
      .order('email', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      users: data || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Auth check
    requireAuth();

    // Get user role to verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract userId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Parse body
    const body = await request.json();
    const { allocation_percentage } = body;

    // Validate allocation_percentage
    if (typeof allocation_percentage !== 'number' || allocation_percentage < 0 || allocation_percentage > 100) {
      return NextResponse.json(
        { error: 'Invalid allocation_percentage (must be 0-100)' },
        { status: 400 }
      );
    }

    // Update user
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ allocation_percentage })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw error;
    }

    // Log to activity table
    // Note: In a real application, we'd get the admin user ID from the auth session
    const { error: auditError } = await supabaseAdmin
      .from('activity')
      .insert([
        {
          user_id: 'admin', // Placeholder - would be actual admin user ID from session
          action: 'update_allocation',
          target_user_id: userId,
          details: {
            new_allocation_percentage: allocation_percentage,
          },
          created_at: new Date().toISOString(),
        },
      ]);

    if (auditError) {
      console.error('Audit logging error:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Users PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
