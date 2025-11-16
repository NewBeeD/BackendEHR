// src/utils/idGenerators.js
const prisma = require('../config/database');

const generateMRN = async () => {
  try {
    // Get the latest MRN from database
    const latestPatient = await prisma.patient.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { mrn: true }
    });

    let nextNumber = 1;
    if (latestPatient && latestPatient.mrn) {
      const lastNumber = parseInt(latestPatient.mrn.replace('MRN', '')) || 0;
      nextNumber = lastNumber + 1;
    }

    // Format as MRN000001, MRN000002, etc.
    return `MRN${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    // Fallback: timestamp + random for emergency
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MRN${timestamp}${random}`;
  }
};

const generateEmployeeId = async () => {
  try {
    // Get the latest employee ID
    const latestStaff = await prisma.staff.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { employeeId: true }
    });

    let nextNumber = 1;
    if (latestStaff && latestStaff.employeeId) {
      const lastNumber = parseInt(latestStaff.employeeId.replace('EMP', '')) || 0;
      nextNumber = lastNumber + 1;
    }

    return `EMP${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp}${random}`;
  }
};

module.exports = {
  generateMRN,
  generateEmployeeId
};