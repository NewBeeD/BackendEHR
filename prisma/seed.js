// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ehr.com' },
    update: {},
    create: {
      email: 'admin@ehr.com',
      password: hashedPassword,
      role: 'Admin',
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
          phone: '+1234567890',
        }
      }
    }
  });

  // Create sample doctor
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctor = await prisma.user.upsert({
    where: { email: 'dr.smith@ehr.com' },
    update: {},
    create: {
      email: 'dr.smith@ehr.com',
      password: doctorPassword,
      role: 'Doctor',
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '+1234567891',
          specialty: 'Cardiology',
          licenseNumber: 'MED123456'
        }
      }
    }
  });

  // Create sample patient
  const patient = await prisma.patient.create({
    data: {
      patientId: 'MR0001',
      email: 'patient1@example.com',
      phone: '+1234567892',
      firstName: 'Alice',
      lastName: 'Johnson',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'Female',
      bloodGroup: 'A_Positive',
      address: '123 Main St, City, State',
      emergencyContact: {
        create: {
          name: 'Bob Johnson',
          relationship: 'Spouse',
          phone: '+1234567893'
        }
      },
      insurance: {
        create: {
          provider: 'Blue Cross',
          policyNumber: 'BC123456',
          effectiveDate: new Date('2023-01-01'),
          expirationDate: new Date('2024-12-31'),
          copay: 20.00,
          deductible: 1000.00
        }
      }
    }
  });

  console.log({ admin, doctor, patient });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });