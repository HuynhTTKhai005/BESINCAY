const StaffActivity = require('../models/staffActivity.model');

const logStaffActivity = async ({ staffId, action, entityType, entityId, description = '', payload = null }) => {
  try {
    if (!staffId || !action || !entityType || !entityId) return;
    await StaffActivity.create({
      staff_id: staffId,
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      description,
      payload
    });
  } catch (error) {
    console.error('Log staff activity error:', error.message);
  }
};

module.exports = { logStaffActivity };
