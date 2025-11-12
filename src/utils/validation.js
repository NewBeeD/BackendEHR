// src/utils/validation.js
const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid('Admin', 'Doctor', 'Nurse', 'Receptionist').required(),
    phone: Joi.string().optional(),
    specialty: Joi.string().when('role', {
      is: 'Doctor',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    licenseNumber: Joi.string().when('role', {
      is: 'Doctor',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const patientValidation = {
  create: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Unknown').required(),
    bloodGroup: Joi.string().valid(
      'A_Positive', 'A_Negative', 'B_Positive', 'B_Negative',
      'AB_Positive', 'AB_Negative', 'O_Positive', 'O_Negative'
    ).optional(),
    address: Joi.string().optional(),
    allergies: Joi.string().optional(),
    medications: Joi.string().optional(),
    conditions: Joi.string().optional(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      relationship: Joi.string().required(),
      phone: Joi.string().required(),
      address: Joi.string().optional()
    }).optional(),
    insurance: Joi.object({
      provider: Joi.string().required(),
      policyNumber: Joi.string().required(),
      groupNumber: Joi.string().optional(),
      effectiveDate: Joi.date().required(),
      expirationDate: Joi.date().optional(),
      copay: Joi.number().optional(),
      deductible: Joi.number().optional()
    }).optional()
  }),

  update: Joi.object({
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    allergies: Joi.string().optional(),
    medications: Joi.string().optional(),
    conditions: Joi.string().optional()
  })
};

const appointmentValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    appointmentDate: Joi.date().required(),
    duration: Joi.number().default(30),
    type: Joi.string().valid(
      'Consultation', 'FollowUp', 'Emergency', 'RoutineCheckup', 'Surgery', 'Therapy'
    ).default('Consultation'),
    reason: Joi.string().required()
  }),

  update: Joi.object({
    status: Joi.string().valid(
      'Scheduled', 'Confirmed', 'InProgress', 'Completed', 'Cancelled', 'NoShow'
    ).optional(),
    notes: Joi.string().optional()
  })
};




const medicalRecordValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    appointmentId: Joi.string().optional(),
    diagnosis: Joi.string().required(),
    symptoms: Joi.string().optional(),
    treatment: Joi.string().optional(),
    notes: Joi.string().optional(),
    height: Joi.number().optional(),
    weight: Joi.number().optional(),
    temperature: Joi.number().optional(),
    bloodPressureSystolic: Joi.number().integer().optional(),
    bloodPressureDiastolic: Joi.number().integer().optional(),
    heartRate: Joi.number().integer().optional(),
    respiratoryRate: Joi.number().integer().optional(),
    followUpDate: Joi.date().optional()
  })
};

const prescriptionValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    medicalRecordId: Joi.string().optional(),
    medication: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    duration: Joi.string().required(),
    instructions: Joi.string().optional(),
    startDate: Joi.date().required(),
    endDate: Joi.date().optional(),
    refills: Joi.number().integer().min(0).default(0)
  })
};

const labResultValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    testName: Joi.string().required(),
    testType: Joi.string().valid(
      'BloodTest', 'UrineTest', 'Imaging', 'Biopsy', 'Culture', 'Genetic', 'Other'
    ).required(),
    result: Joi.string().required(),
    normalRange: Joi.string().optional(),
    units: Joi.string().optional(),
    notes: Joi.string().optional(),
    performedAt: Joi.date().optional(),
    status: Joi.string().valid(
      'Pending', 'Completed', 'Abnormal', 'Critical', 'Cancelled'
    ).default('Pending'),
    attachment: Joi.string().optional()
  })
};

const billingValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    appointmentId: Joi.string().optional(),
    amount: Joi.number().positive().required(),
    serviceDate: Joi.date().required(),
    dueDate: Joi.date().optional(),
    notes: Joi.string().optional(),
    insuranceClaimId: Joi.string().optional()
  })
};




module.exports = {
  authValidation,
  patientValidation,
  appointmentValidation,
  medicalRecordValidation,
  prescriptionValidation,
  labResultValidation,
  billingValidation
};