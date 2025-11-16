// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed data generation...');

  // Create users with different roles
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Chen',
          phone: '+1-555-0101',
          dateOfBirth: new Date('1980-03-15'),
          address: '123 Admin Blvd, Medical Center, MC 12345'
        }
      },
      staff: {
        create: {
          employeeId: 'EMP000001',
          department: 'Administration',
          specialization: 'Healthcare Administration'
        }
      }
    }
  });

  // Doctors - FIXED: Removed specialty and licenseNumber from profile, added licenseNumber to staff
  const doctor1 = await prisma.user.create({
    data: {
      email: 'dr.smith@hospital.com',
      password: hashedPassword,
      role: 'DOCTOR',
      profile: {
        create: {
          firstName: 'James',
          lastName: 'Smith',
          phone: '+1-555-0102',
          dateOfBirth: new Date('1975-08-22'),
          address: '456 Doctor Lane, Medical Center, MC 12345'
          // REMOVED: specialty and licenseNumber (they don't belong in UserProfile)
        }
      },
      staff: {
        create: {
          employeeId: 'EMP000002',
          department: 'Cardiology',
          specialization: 'Interventional Cardiology',
          licenseNumber: 'MD123456' // ADDED: licenseNumber belongs in Staff model
        }
      }
    }
  });

  const doctor2 = await prisma.user.create({
    data: {
      email: 'dr.johnson@hospital.com',
      password: hashedPassword,
      role: 'DOCTOR',
      profile: {
        create: {
          firstName: 'Lisa',
          lastName: 'Johnson',
          phone: '+1-555-0103',
          dateOfBirth: new Date('1982-11-30'),
          address: '789 Physician Ave, Medical Center, MC 12345'
          // REMOVED: specialty and licenseNumber (they don't belong in UserProfile)
        }
      },
      staff: {
        create: {
          employeeId: 'EMP000003',
          department: 'Pediatrics',
          specialization: 'Pediatric Cardiology',
          licenseNumber: 'MD123457' // ADDED: licenseNumber belongs in Staff model
        }
      }
    }
  });

  // Nurses
  const nurse1 = await prisma.user.create({
    data: {
      email: 'nurse.wilson@hospital.com',
      password: hashedPassword,
      role: 'NURSE',
      profile: {
        create: {
          firstName: 'Maria',
          lastName: 'Wilson',
          phone: '+1-555-0104',
          dateOfBirth: new Date('1988-05-14'),
          address: '321 Nurse Street, Medical Center, MC 12345'
        }
      },
      staff: {
        create: {
          employeeId: 'EMP000004',
          department: 'Emergency',
          specialization: 'Emergency Care'
        }
      }
    }
  });

  // Lab Technician
  const labTech = await prisma.user.create({
    data: {
      email: 'lab.tech@hospital.com',
      password: hashedPassword,
      role: 'LAB_TECH',
      profile: {
        create: {
          firstName: 'David',
          lastName: 'Brown',
          phone: '+1-555-0105',
          dateOfBirth: new Date('1990-07-19'),
          address: '654 Lab Road, Medical Center, MC 12345'
        }
      },
      staff: {
        create: {
          employeeId: 'EMP000005',
          department: 'Laboratory',
          specialization: 'Clinical Pathology'
        }
      }
    }
  });

  // Receptionist
  const receptionist = await prisma.user.create({
    data: {
      email: 'reception@hospital.com',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      profile: {
        create: {
          firstName: 'Emily',
          lastName: 'Davis',
          phone: '+1-555-0106',
          dateOfBirth: new Date('1992-09-25'),
          address: '987 Front Desk Dr, Medical Center, MC 12345'
        }
      },
      staff: {
        create: {
          employeeId: 'EMP000006',
          department: 'Administration',
          specialization: 'Patient Services'
        }
      }
    }
  });

  // Patients (some with user accounts, some without)
  const patient1 = await prisma.patient.create({
    data: {
      mrn: 'MR000001',
      firstName: 'Robert',
      lastName: 'Taylor',
      dateOfBirth: new Date('1965-03-12'),
      gender: 'MALE',
      phone: '+1-555-0201',
      email: 'robert.taylor@example.com',
      address: '123 Oak Street, Springfield, SP 12345',
      bloodType: 'A_POSITIVE',
      allergies: 'Penicillin, Shellfish',
      medications: 'Lisinopril 10mg daily, Metformin 500mg twice daily',
      conditions: 'Hypertension, Type 2 Diabetes',
      createdBy: { connect: { id: receptionist.id } },
      emergencyContact: {
        create: {
          name: 'Jennifer Taylor',
          relationship: 'Wife',
          phone: '+1-555-0202',
          address: '123 Oak Street, Springfield, SP 12345'
        }
      },
      insurance: {
        create: {
          provider: 'Blue Cross Blue Shield',
          policyNumber: 'BCBS123456789',
          groupNumber: 'GRP987654',
          effectiveDate: new Date('2024-01-01'),
          expirationDate: new Date('2024-12-31'),
          copay: 25.00,
          deductible: 1500.00
        }
      },
      allergiesList: {
        create: [
          {
            allergen: 'Penicillin',
            severity: 'SEVERE',
            reaction: 'Anaphylaxis, difficulty breathing',
            onsetDate: new Date('2010-05-15'),
            status: 'ACTIVE'
          },
          {
            allergen: 'Shellfish',
            severity: 'MODERATE',
            reaction: 'Hives, swelling',
            onsetDate: new Date('2015-08-22'),
            status: 'ACTIVE'
          }
        ]
      }
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      mrn: 'MR000002',
      firstName: 'Susan',
      lastName: 'Miller',
      dateOfBirth: new Date('1978-11-05'),
      gender: 'FEMALE',
      phone: '+1-555-0203',
      email: 'susan.miller@example.com',
      address: '456 Maple Avenue, Springfield, SP 12345',
      bloodType: 'O_POSITIVE',
      allergies: 'Aspirin, Latex',
      medications: 'Levothyroxine 50mcg daily, Vitamin D 2000IU daily',
      conditions: 'Hypothyroidism, Osteoporosis',
      createdBy: { connect: { id: receptionist.id } },
      emergencyContact: {
        create: {
          name: 'Michael Miller',
          relationship: 'Husband',
          phone: '+1-555-0204',
          address: '456 Maple Avenue, Springfield, SP 12345'
        }
      },
      insurance: {
        create: {
          provider: 'Aetna',
          policyNumber: 'AET789012345',
          groupNumber: 'GRP123456',
          effectiveDate: new Date('2024-01-01'),
          expirationDate: new Date('2024-12-31'),
          copay: 30.00,
          deductible: 2000.00
        }
      }
    }
  });

  const patient3 = await prisma.patient.create({
    data: {
      mrn: 'MR000003',
      firstName: 'Thomas',
      lastName: 'Anderson',
      dateOfBirth: new Date('1952-07-18'),
      gender: 'MALE',
      phone: '+1-555-0205',
      email: 'thomas.anderson@example.com',
      address: '789 Pine Road, Springfield, SP 12345',
      bloodType: 'B_POSITIVE',
      allergies: 'None known',
      medications: 'Atorvastatin 20mg daily, Metoprolol 25mg twice daily, Aspirin 81mg daily',
      conditions: 'Hyperlipidemia, Hypertension, Coronary Artery Disease',
      createdBy: { connect: { id: receptionist.id } },
      emergencyContact: {
        create: {
          name: 'Linda Anderson',
          relationship: 'Daughter',
          phone: '+1-555-0206',
          address: '789 Pine Road, Springfield, SP 12345'
        }
      },
      insurance: {
        create: {
          provider: 'UnitedHealthcare',
          policyNumber: 'UHC456789012',
          groupNumber: 'GRP456789',
          effectiveDate: new Date('2024-01-01'),
          expirationDate: new Date('2024-12-31'),
          copay: 20.00,
          deductible: 1000.00
        }
      }
    }
  });

  // Create appointments
  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      providerId: doctor1.id,
      appointmentDate: new Date('2024-02-15T09:00:00Z'),
      duration: 30,
      type: 'CONSULTATION',
      reason: 'Follow-up for hypertension management',
      notes: 'Patient reports good medication compliance, no side effects'
    }
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      providerId: doctor2.id,
      appointmentDate: new Date('2024-02-16T10:30:00Z'),
      duration: 45,
      type: 'ROUTINE_CHECKUP',
      reason: 'Annual physical examination',
      notes: 'Routine thyroid function tests ordered'
    }
  });

  const appointment3 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      providerId: doctor1.id,
      appointmentDate: new Date('2024-02-14T14:15:00Z'),
      duration: 60,
      type: 'FOLLOW_UP',
      reason: 'Cardiac follow-up post stent placement',
      status: 'COMPLETED',
      notes: 'Patient doing well, no chest pain reported'
    }
  });

  // Create medical records
  const medicalRecord1 = await prisma.medicalRecord.create({
    data: {
      patientId: patient1.id,
      providerId: doctor1.id,
      appointmentId: appointment1.id,
      chiefComplaint: 'Hypertension follow-up',
      historyOfPresentIllness: 'Patient returns for routine follow-up of hypertension. Reports good compliance with medications. No headaches, dizziness, or chest pain.',
      pastMedicalHistory: 'Hypertension x 5 years, Type 2 Diabetes x 3 years',
      medications: 'Lisinopril 10mg daily, Metformin 500mg twice daily',
      allergies: 'Penicillin, Shellfish',
      socialHistory: 'Non-smoker, occasional alcohol (1-2 drinks/week)',
      familyHistory: 'Father with hypertension and CAD, mother with diabetes',
      examination: 'BP 128/78, HR 72 regular, RR 16, Temp 98.6°F. Heart: RRR, no murmurs. Lungs: clear bilaterally.',
      assessment: 'Hypertension well-controlled on current regimen. Diabetes stable.',
      plan: 'Continue current medications. Follow up in 3 months. Check basic metabolic panel.',
      height: 175,
      weight: 82,
      bloodPressure: '128/78',
      heartRate: 72,
      respiratoryRate: 16,
      temperature: 98.6,
      visitDate: new Date('2024-02-15T09:00:00Z')
    }
  });

  const medicalRecord2 = await prisma.medicalRecord.create({
    data: {
      patientId: patient3.id,
      providerId: doctor1.id,
      appointmentId: appointment3.id,
      chiefComplaint: 'Cardiac follow-up',
      historyOfPresentIllness: 'Patient s/p cardiac stent placement 6 months ago. No chest pain, shortness of breath, or palpitations. Good exercise tolerance.',
      pastMedicalHistory: 'CAD s/p stent x 2, Hyperlipidemia, Hypertension',
      medications: 'Atorvastatin 20mg daily, Metoprolol 25mg twice daily, Aspirin 81mg daily',
      allergies: 'None',
      socialHistory: 'Former smoker (quit 5 years ago), no alcohol',
      familyHistory: 'Brother with CAD, father with MI at age 65',
      examination: 'BP 122/76, HR 68 regular. Heart: RRR, no murmurs. Lungs: clear.',
      assessment: 'CAD stable post-stent. Hyperlipidemia and hypertension well-controlled.',
      plan: 'Continue current medications. Stress test in 6 months. Lipid panel today.',
      height: 178,
      weight: 85,
      bloodPressure: '122/76',
      heartRate: 68,
      visitDate: new Date('2024-02-14T14:15:00Z')
    }
  });

  // Create prescriptions
  const prescription1 = await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      providerId: doctor1.id,
      medicalRecordId: medicalRecord1.id,
      medication: 'Lisinopril',
      dosage: '10 mg',
      frequency: 'Once daily',
      duration: '90 days',
      route: 'ORAL',
      instructions: 'Take in the morning with or without food',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-05-15'),
      status: 'ACTIVE',
      refills: 2,
      refillsRemaining: 2
    }
  });

  const prescription2 = await prisma.prescription.create({
    data: {
      patientId: patient3.id,
      providerId: doctor1.id,
      medicalRecordId: medicalRecord2.id,
      medication: 'Atorvastatin',
      dosage: '20 mg',
      frequency: 'Once daily',
      duration: '90 days',
      route: 'ORAL',
      instructions: 'Take at bedtime',
      startDate: new Date('2024-02-14'),
      endDate: new Date('2024-05-14'),
      status: 'ACTIVE',
      refills: 3,
      refillsRemaining: 3
    }
  });

  // Create lab results
  const labResult1 = await prisma.labResult.create({
    data: {
      patientId: patient1.id,
      providerId: doctor1.id,
      medicalRecordId: medicalRecord1.id,
      testName: 'Basic Metabolic Panel',
      testType: 'BLOOD_TEST',
      result: 'Within normal limits',
      normalRange: 'See individual components',
      units: 'Various',
      performedAt: new Date('2024-02-10T08:30:00Z'),
      status: 'COMPLETED',
      notes: 'All values within reference range'
    }
  });

  const labResult2 = await prisma.labResult.create({
    data: {
      patientId: patient3.id,
      providerId: doctor1.id,
      medicalRecordId: medicalRecord2.id,
      testName: 'Lipid Panel',
      testType: 'BLOOD_TEST',
      result: 'LDL: 85, HDL: 45, Triglycerides: 120',
      normalRange: 'LDL: <100, HDL: >40, Triglycerides: <150',
      units: 'mg/dL',
      performedAt: new Date('2024-02-14T10:00:00Z'),
      status: 'COMPLETED',
      notes: 'Excellent lipid control on current statin therapy'
    }
  });

  // Create vital signs
  await prisma.vitalSign.create({
    data: {
      patientId: patient1.id,
      recordedBy: nurse1.id,
      bloodPressureSystolic: 128,
      bloodPressureDiastolic: 78,
      heartRate: 72,
      temperature: 98.6,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 82,
      height: 175,
      bmi: 26.8,
      recordedAt: new Date('2024-02-15T08:45:00Z')
    }
  });

  await prisma.vitalSign.create({
    data: {
      patientId: patient3.id,
      recordedBy: nurse1.id,
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 76,
      heartRate: 68,
      temperature: 98.4,
      respiratoryRate: 14,
      oxygenSaturation: 99,
      weight: 85,
      height: 178,
      bmi: 26.8,
      recordedAt: new Date('2024-02-14T14:00:00Z')
    }
  });

  // Create diagnoses
  await prisma.diagnosis.create({
    data: {
      medicalRecordId: medicalRecord1.id,
      patientId: patient1.id,
      code: 'I10',
      description: 'Essential (primary) hypertension',
      type: 'CHRONIC',
      status: 'ACTIVE'
    }
  });

  await prisma.diagnosis.create({
    data: {
      medicalRecordId: medicalRecord1.id,
      patientId: patient1.id,
      code: 'E11.9',
      description: 'Type 2 diabetes mellitus without complications',
      type: 'CHRONIC',
      status: 'ACTIVE'
    }
  });

  await prisma.diagnosis.create({
    data: {
      medicalRecordId: medicalRecord2.id,
      patientId: patient3.id,
      code: 'I25.10',
      description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris',
      type: 'CHRONIC',
      status: 'ACTIVE'
    }
  });

  console.log('Seed data generated successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });