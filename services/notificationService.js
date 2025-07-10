const Notification = require('../models/Notification');
const socket = require('../config/socket');
const User = require('../models/User');

class NotificationService {
  // General notification creator
  static async createNotification({
    recipients,
    sender,
    message,
    type,
    data = {}
  }) {
    if (!Array.isArray(recipients)) {
      recipients = [recipients];
    }

    const notifications = recipients.map(recipient => ({
      recipient,
      sender,
      message,
      type,
      data,
      isRead: false
    }));

    const created = await Notification.insertMany(notifications);

    // Emit real-time notifications via Socket.IO
    recipients.forEach(recipientId => {
      socket.to(`user_${recipientId}`).emit('notification:new', {
        message,
        type,
        data
      });
    });

    return created;
  }

  // Department-wide alerts
  static async sendDepartmentAlert(deptName, hospitalId, message, sender) {
    const staff = await User.find({
      department: deptName,
      hospital: hospitalId
    }).select('_id');

    if (staff.length === 0) return null;

    return this.createNotification({
      recipients: staff.map(u => u._id),
      sender,
      message,
      type: 'DEPARTMENT_ALERT'
    });
  }

  // Patient transfer notifications
  static async sendTransferNotification({
    toDepartment,
    hospitalId,
    patientId,
    fromDoctor
  }) {
    const targetStaff = await User.find({
      department: toDepartment,
      hospital: hospitalId,
      role: { $in: ['doctor', 'nurse'] }
    }).select('_id');

    return this.createNotification({
      recipients: targetStaff.map(u => u._id),
      sender: fromDoctor,
      message: `New patient transfer to ${toDepartment}`,
      type: 'PATIENT_TRANSFER',
      data: { patientId }
    });
  }

  // Critical lab results
  static async sendCriticalResult(patientId, testType, result, doctorId) {
    return this.createNotification({
      recipients: doctorId,
      sender: null, // System-generated
      message: `Critical ${testType} result for patient ${patientId}`,
      type: 'CRITICAL_RESULT',
      data: { patientId, testType, result }
    });
  }
}

module.exports = NotificationService;