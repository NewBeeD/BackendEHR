// src/middleware/validation.js
const Joi = require('joi');

// Auth validations
const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'LAB_TECH', 'PHARMACIST').required(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    address: Joi.string().max(200).optional(),
    // Staff-specific fields
    department: Joi.string().when('role', {
      is: Joi.valid('DOCTOR', 'NURSE', 'ADMIN', 'LAB_TECH', 'PHARMACIST'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    specialization: Joi.string().when('role', {
      is: 'DOCTOR',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    licenseNumber: Joi.string().when('role', {
      is: 'DOCTOR',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

// Patient validations
const patientValidation = {
  create: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().max('now').required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'UNKNOWN').required(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    email: Joi.string().email().optional(),
    address: Joi.string().max(200).optional(),
    bloodType: Joi.string().valid(
      'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
      'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'
    ).optional(),
    allergies: Joi.string().max(500).optional(),
    medications: Joi.string().max(500).optional(),
    conditions: Joi.string().max(500).optional(),
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
      copay: Joi.number().min(0).optional(),
      deductible: Joi.number().min(0).optional()
    }).optional()
  }),

  update: Joi.object({
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    address: Joi.string().max(200).optional(),
    allergies: Joi.string().max(500).optional(),
    medications: Joi.string().max(500).optional(),
    conditions: Joi.string().max(500).optional()
  })
};

// Medical record validations
const medicalRecordValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    chiefComplaint: Joi.string().required(),
    historyOfPresentIllness: Joi.string().optional(),
    pastMedicalHistory: Joi.string().optional(),
    medications: Joi.string().optional(),
    allergies: Joi.string().optional(),
    socialHistory: Joi.string().optional(),
    familyHistory: Joi.string().optional(),
    examination: Joi.string().optional(),
    assessment: Joi.string().required(),
    plan: Joi.string().required(),
    height: Joi.number().min(0).max(300).optional(),
    weight: Joi.number().min(0).max(500).optional(),
    temperature: Joi.number().min(30).max(45).optional(),
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).optional(),
    heartRate: Joi.number().integer().min(30).max(200).optional(),
    respiratoryRate: Joi.number().integer().min(8).max(60).optional(),
    oxygenSaturation: Joi.number().min(0).max(100).optional(),
    followUpDate: Joi.date().min('now').optional()
  })
};

// Appointment validations
const appointmentValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    appointmentDate: Joi.date().min('now').required(),
    duration: Joi.number().integer().min(15).max(240).default(30),
    type: Joi.string().valid(
      'CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_CHECKUP', 'SURGERY', 'THERAPY', 'LAB_TEST'
    ).default('CONSULTATION'),
    reason: Joi.string().max(500).required(),
    notes: Joi.string().max(1000).optional()
  })
};

// Prescription validations
const prescriptionValidation = {
  create: Joi.object({
    patientId: Joi.string().required(),
    medicalRecordId: Joi.string().optional(),
    medication: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    duration: Joi.string().required(),
    route: Joi.string().valid(
      'ORAL', 'TOPICAL', 'INTRAVENOUS', 'INTRAMUSCULAR', 'SUBCUTANEOUS', 'INHALATION', 'RECTAL'
    ).required(),
    instructions: Joi.string().max(500).optional(),
    startDate: Joi.date().min('now').required(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    refills: Joi.number().integer().min(0).max(12).default(0)
  })
};

module.exports = {
  authValidation,
  patientValidation,
  medicalRecordValidation,
  appointmentValidation,
  prescriptionValidation
};