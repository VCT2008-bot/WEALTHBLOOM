import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isSuperAdmin, roleLabel } from '../../shared/auth.ts';

// Super Admin changes another user's role:
// Member <-> Admin <-> Super Admin.
// All role changes are audit-logged.
// This function does NOT modify financial data.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Get authenticated administrator
    const admin = await base44.auth.me();

    // Only Super Admins may change roles
    if (!admin || !isSuperAdmin(admin.role)) {
      return Response.json(
        { error: 'Forbidden — Super Admin only' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const userId = body.user_id;
    const newRole = body.new_role;
    const reason = body.reason || '';

    if (!userId) {
      return Response.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    // Supported roles
    const allowedRoles = ['user', 'admin', 'super_admin'];

    if (!allowedRoles.includes(newRole)) {
      return Response.json(
        {
          error:
            'new_role must be user, admin, or super_admin'
        },
        { status: 400 }
      );
    }

    // Prevent Super Admin from changing their own role
    if (userId === admin.id) {
      return Response.json(
        {
          error: 'You cannot change your own role'
        },
        { status: 400 }
      );
    }

    // Find target user
    const users =
      await base44.asServiceRole.entities.User.filter({
        id: userId
      });

    if (!users.length) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const target = users[0];

    const previousRole = target.role || 'user';

    // No need to update if role is already the same
    if (previousRole === newRole) {
      return Response.json(
        {
          error: `User already has the ${roleLabel(newRole)} role`
        },
        { status: 400 }
      );
    }

    // Update role using server-side service privileges
    await base44.asServiceRole.entities.User.update(
      userId,
      {
        role: newRole
      }
    );

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id,
      admin_name: admin.full_name || admin.email,

      action: 'role_change',

      affected_user: userId,
      affected_transaction: '-',

      target_name:
        target.full_name || target.email,

      previous_role: previousRole,
      new_role: newRole,

      reason,

      description:
        `Changed ${target.full_name || target.email} role ` +
        `from ${roleLabel(previousRole)} ` +
        `to ${roleLabel(newRole)}. ` +
        `By ${admin.full_name || admin.email}.` +
        `${reason ? ' Reason: ' + reason : ''}`
    });

    return Response.json({
      ok: true,
      message: 'User role updated successfully',
      user_id: userId,
      previous_role: previousRole,
      new_role: newRole
    });

  } catch (error) {
    console.error('Role change error:', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}