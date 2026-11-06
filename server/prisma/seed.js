import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const hash = (value) => bcrypt.hashSync(value, 10);

async function main() {
  console.log('Seeding Amaravati One...');

  await prisma.credentialVerification.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.officerAssignment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dueDate.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.application.deleteMany();
  await prisma.service.deleteMany();
  await prisma.citizenProfile.deleteMany();
  await prisma.user.deleteMany();

  const [admin, officer, officer2, citizen, citizen2] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@amaravati.one',
        passwordHash: hash('Admin@123'),
        fullName: 'Commissioner Admin',
        phone: '9000000001',
        role: 'ADMIN',
        phoneVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'officer@amaravati.one',
        passwordHash: hash('Officer@123'),
        fullName: 'K. Srinivas',
        phone: '9000000002',
        role: 'OFFICER',
        phoneVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'officer2@amaravati.one',
        passwordHash: hash('Officer@123'),
        fullName: 'P. Lakshmi',
        phone: '9000000005',
        role: 'OFFICER',
        phoneVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'citizen@amaravati.one',
        passwordHash: hash('Citizen@123'),
        fullName: 'A. Ravi Teja',
        phone: '9000000003',
        role: 'CITIZEN',
        phoneVerified: true,
        profile: {
          create: {
            aadhaarNumber: 'XXXX XXXX 4821',
            addressLine: 'Flat 402, Sri Sai Residency, Benz Circle',
            city: 'Vijayawada',
            district: 'NTR',
            state: 'Andhra Pradesh',
            pincode: '520010',
            dateOfBirth: new Date('1992-06-14'),
            gender: 'Male',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'priya@amaravati.one',
        passwordHash: hash('Citizen@123'),
        fullName: 'K. Priya',
        phone: '9000000004',
        role: 'CITIZEN',
        phoneVerified: false,
        profile: {
          create: {
            aadhaarNumber: 'XXXX XXXX 7710',
            addressLine: 'Plot 12, Ayyappa Society, Guntur',
            city: 'Guntur',
            district: 'Guntur',
            state: 'Andhra Pradesh',
            pincode: '522002',
            dateOfBirth: new Date('1996-11-02'),
            gender: 'Female',
          },
        },
      },
    }),
  ]);

  const servicesData = [
    {
      code: 'PROPERTY_TAX_CLEARANCE',
      name: 'Property Tax Clearance',
      category: 'Property Services',
      description:
        'Obtain a tax clearance certificate for your residential or commercial property in Amaravati.',
      eligibility: 'Property owner with an active assessment record in the municipal database.',
      requiredDocuments: ['Property tax receipt', 'Sale deed', 'Aadhaar card', 'Latest assessment notice'],
      fee: 500,
      processingDays: 7,
    },
    {
      code: 'PROPERTY_MUTATION',
      name: 'Property Mutation',
      category: 'Property Services',
      description: 'Transfer property ownership records after purchase, inheritance or gift.',
      eligibility: 'Registered owner or legal heir with a valid sale deed or succession certificate.',
      requiredDocuments: ['Registered sale deed', 'Aadhaar card', 'Encumbrance certificate', 'No-dues certificate'],
      fee: 1000,
      processingDays: 15,
    },
    {
      code: 'WATER_CONNECTION',
      name: 'New Water Connection',
      category: 'Water Services',
      description: 'Apply for a new domestic or commercial water connection from the city utility.',
      eligibility: 'Owner or occupant of a property within the municipal water supply area.',
      requiredDocuments: ['Proof of ownership', 'Aadhaar card', 'Site plan', 'Tax paid receipt'],
      fee: 1500,
      processingDays: 10,
    },
    {
      code: 'ELECTRICITY_NAME_CHANGE',
      name: 'Electricity Name Change',
      category: 'Electricity Services',
      description: 'Change the registered consumer name on an existing electricity connection.',
      eligibility: 'Property owner or legal occupant with a valid connection.',
      requiredDocuments: ['Electricity bill', 'Ownership proof', 'Aadhaar card', 'No objection certificate'],
      fee: 750,
      processingDays: 5,
    },
    {
      code: 'BUILDING_PERMISSION',
      name: 'Building Permission',
      category: 'Building Permissions',
      description: 'Seek approval for new construction, extension or modification of a building.',
      eligibility: 'Owner of a plot with clear title within the Amaravati planning area.',
      requiredDocuments: ['Title deed', 'Approved site plan', 'Structural drawings', 'Aadhaar card'],
      fee: 5000,
      processingDays: 21,
    },
    {
      code: 'TRADE_LICENCE',
      name: 'Trade Licence',
      category: 'Trade Licences',
      description: 'Register or renew a trade licence for shops, establishments and businesses.',
      eligibility: 'Business owner operating within municipal limits.',
      requiredDocuments: ['GST registration', 'Rental agreement or ownership proof', 'Aadhaar card', 'NOC from fire department'],
      fee: 2500,
      processingDays: 12,
    },
    {
      code: 'BIRTH_CERTIFICATE',
      name: 'Birth Certificate',
      category: 'Municipal Services',
      description: 'Apply for a birth certificate for a child born within the municipal jurisdiction.',
      eligibility: 'Parent or guardian of the child with hospital records.',
      requiredDocuments: ['Hospital birth record', 'Parents Aadhaar cards', 'Address proof'],
      fee: 100,
      processingDays: 7,
    },
    {
      code: 'PUBLIC_GRIEVANCE',
      name: 'Public Grievance',
      category: 'Public Grievances',
      description: 'Report a civic issue such as roads, drainage, street lighting or sanitation.',
      eligibility: 'Any citizen or resident of Amaravati.',
      requiredDocuments: ['Photograph of the issue (optional)', 'Location details'],
      fee: 0,
      processingDays: 3,
    },
  ];

  const serviceMap = {};
  for (const data of servicesData) {
    serviceMap[data.code] = await prisma.service.create({ data });
  }

  fs.mkdirSync(uploadsDir, { recursive: true });
  const demoDocPath = path.join(uploadsDir, 'demo-property-tax-receipt.txt');
  fs.writeFileSync(
    demoDocPath,
    'Amaravati One demo document\nProperty Tax Receipt\nAssessment: AMR-PT-2025-1187\nStatus: PAID\n',
    'utf8'
  );

  const app1 = await prisma.application.create({
    data: {
      referenceNo: 'AMA-2026-001',
      userId: citizen.id,
      serviceId: serviceMap.PROPERTY_TAX_CLEARANCE.id,
      status: 'UNDER_REVIEW',
      assignedOfficerId: officer.id,
      submittedAt: days(-10),
      formData: {
        assessmentNo: 'AMR-PT-2025-1187',
        propertyType: 'Residential',
        ward: 'Ward 21 - Benz Circle',
        remarks: 'Requesting clearance for home loan documentation.',
      },
      statusHistory: {
        create: [
          { status: 'SUBMITTED', remarks: 'Application submitted by citizen.', createdAt: days(-10) },
          { status: 'DOCUMENTS_VERIFIED', remarks: 'Documents verified by officer.', changedById: officer.id, createdAt: days(-8) },
          { status: 'UNDER_REVIEW', remarks: 'Under review with the revenue section.', changedById: officer.id, createdAt: days(-6) },
        ],
      },
      documents: {
        create: {
          uploadedById: citizen.id,
          fileName: 'demo-property-tax-receipt.txt',
          filePath: 'uploads/demo-property-tax-receipt.txt',
          mimeType: 'text/plain',
          size: fs.statSync(demoDocPath).size,
          documentType: 'Property tax receipt',
          isVerified: true,
          verifiedById: officer.id,
          verifiedAt: days(-8),
          createdAt: days(-10),
        },
      },
      assignments: {
        create: { officerId: officer.id, assignedById: admin.id, assignedAt: days(-9) },
      },
    },
  });

  const app2 = await prisma.application.create({
    data: {
      referenceNo: 'AMA-2026-002',
      userId: citizen.id,
      serviceId: serviceMap.TRADE_LICENCE.id,
      status: 'SUBMITTED',
      assignedOfficerId: officer2.id,
      submittedAt: days(-2),
      formData: {
        businessName: 'Sri Lakshmi Mini Mart',
        tradeType: 'Retail grocery',
        address: 'Door No. 24-6-8, Gandhi Nagar, Vijayawada',
        gstin: '37ABCDE1234F1Z5',
      },
      statusHistory: {
        create: { status: 'SUBMITTED', remarks: 'Application submitted by citizen.', createdAt: days(-2) },
      },
      assignments: {
        create: { officerId: officer2.id, assignedById: admin.id, assignedAt: days(-2) },
      },
    },
  });

  const app3 = await prisma.application.create({
    data: {
      referenceNo: 'AMA-2026-003',
      userId: citizen.id,
      serviceId: serviceMap.BIRTH_CERTIFICATE.id,
      status: 'APPROVED',
      assignedOfficerId: officer.id,
      submittedAt: days(-30),
      decidedAt: days(-20),
      officerRemarks: 'Hospital records verified. Certificate issued.',
      formData: {
        childName: 'A. Hasini',
        dateOfBirth: '2026-09-18',
        hospital: 'Government General Hospital, Vijayawada',
        parentName: 'A. Ravi Teja',
      },
      statusHistory: {
        create: [
          { status: 'SUBMITTED', remarks: 'Application submitted by citizen.', createdAt: days(-30) },
          { status: 'DOCUMENTS_VERIFIED', remarks: 'Hospital record verified.', changedById: officer.id, createdAt: days(-28) },
          { status: 'UNDER_REVIEW', remarks: 'Sent for registrar approval.', changedById: officer.id, createdAt: days(-25) },
          { status: 'APPROVED', remarks: 'Certificate issued.', changedById: officer.id, createdAt: days(-20) },
        ],
      },
    },
  });

  const app4 = await prisma.application.create({
    data: {
      referenceNo: 'AMA-2026-004',
      userId: citizen2.id,
      serviceId: serviceMap.WATER_CONNECTION.id,
      status: 'CORRECTION_REQUESTED',
      assignedOfficerId: officer2.id,
      submittedAt: days(-6),
      officerRemarks: 'Site plan is unclear. Please upload a signed and scaled site plan.',
      formData: {
        propertyAddress: 'Plot 12, Ayyappa Society, Guntur',
        connectionType: 'Domestic',
        occupants: 4,
      },
      statusHistory: {
        create: [
          { status: 'SUBMITTED', remarks: 'Application submitted by citizen.', createdAt: days(-6) },
          { status: 'CORRECTION_REQUESTED', remarks: 'Site plan is unclear. Please upload a signed and scaled site plan.', changedById: officer2.id, createdAt: days(-3) },
        ],
      },
      assignments: {
        create: { officerId: officer2.id, assignedById: admin.id, assignedAt: days(-5) },
      },
    },
  });

  const pay1 = await prisma.payment.create({
    data: {
      referenceNo: 'PAY-2026-0001',
      userId: citizen.id,
      applicationId: app1.id,
      amount: 500,
      status: 'SUCCESS',
      purpose: 'Property Tax Clearance fee',
      transactionId: 'UPI-8834201195',
      upiId: 'ravi.teja@okhdfcbank',
      paidAt: days(-9),
      createdAt: days(-10),
    },
  });
  await prisma.payment.create({
    data: {
      referenceNo: 'PAY-2026-0002',
      userId: citizen.id,
      applicationId: app2.id,
      amount: 2500,
      status: 'PENDING',
      purpose: 'Trade Licence fee',
      createdAt: days(-2),
    },
  });
  const pay3 = await prisma.payment.create({
    data: {
      referenceNo: 'PAY-2026-0003',
      userId: citizen.id,
      applicationId: app3.id,
      amount: 100,
      status: 'SUCCESS',
      purpose: 'Birth Certificate fee',
      transactionId: 'UPI-4410298377',
      upiId: 'ravi.teja@okhdfcbank',
      paidAt: days(-29),
      createdAt: days(-30),
    },
  });
  await prisma.payment.create({
    data: {
      referenceNo: 'PAY-2026-0004',
      userId: citizen2.id,
      applicationId: app4.id,
      amount: 1500,
      status: 'PENDING',
      purpose: 'New Water Connection fee',
      createdAt: days(-6),
    },
  });

  const credAadhaar = await prisma.credential.create({
    data: {
      userId: citizen.id,
      type: 'AADHAAR',
      title: 'Aadhaar Identity',
      issuer: 'UIDAI',
      credentialNumber: 'XXXX XXXX 4821',
      status: 'VERIFIED',
      issuedAt: new Date('2015-04-12'),
      verifiedAt: days(-40),
      metadata: { linked: true, masked: true, note: 'Simulated verification for prototype' },
    },
  });
  await prisma.credentialVerification.create({
    data: { credentialId: credAadhaar.id, status: 'VERIFIED', method: 'SIMULATED', remarks: 'Demo verification', verifiedAt: days(-40) },
  });

  await prisma.credential.create({
    data: {
      userId: citizen.id,
      type: 'DIGILOCKER',
      title: 'DigiLocker Account',
      issuer: 'DigiLocker',
      credentialNumber: 'DL-AP-USER-2048',
      status: 'PENDING',
      metadata: { linked: false, note: 'Consent-based integration placeholder' },
    },
  });

  const credProperty = await prisma.credential.create({
    data: {
      userId: citizen.id,
      type: 'PROPERTY',
      title: 'Property Ownership Record',
      issuer: 'APCRDA',
      credentialNumber: 'AP-AMR-2024-7781',
      status: 'VERIFIED',
      issuedAt: new Date('2024-03-08'),
      verifiedAt: days(-30),
      metadata: { location: 'Benz Circle, Vijayawada', areaSqft: 1240, assessmentNo: 'AMR-PT-2025-1187' },
    },
  });
  await prisma.credentialVerification.create({
    data: { credentialId: credProperty.id, status: 'VERIFIED', method: 'SIMULATED', remarks: 'Ownership record matched', verifiedAt: days(-30) },
  });

  await prisma.credential.create({
    data: {
      userId: citizen.id,
      type: 'LICENCE',
      title: 'Driving Licence',
      issuer: 'Transport Department, Andhra Pradesh',
      credentialNumber: 'DL-AP-2023-9931',
      status: 'VERIFIED',
      issuedAt: new Date('2023-02-17'),
      expiresAt: days(20),
      verifiedAt: days(-15),
      metadata: { vehicleClasses: ['MCWG', 'LMV'], note: 'Simulated verification for prototype' },
    },
  });

  await prisma.credential.create({
    data: {
      userId: citizen.id,
      type: 'DOCUMENT',
      title: 'Income Certificate',
      issuer: 'Revenue Department',
      credentialNumber: 'INC-AP-2025-5512',
      status: 'PENDING',
      issuedAt: days(-90),
      metadata: { uploadedBy: 'citizen', note: 'Awaiting verification' },
    },
  });

  await prisma.dueDate.createMany({
    data: [
      {
        userId: citizen.id,
        type: 'PROPERTY_TAX',
        title: 'Property tax instalment',
        description: 'Second instalment for assessment AMR-PT-2025-1187.',
        dueDate: days(7),
        amount: 4200,
        referenceId: 'AMR-PT-2025-1187',
      },
      {
        userId: citizen.id,
        type: 'PAYMENT_DEADLINE',
        title: 'Trade Licence fee pending',
        description: 'Complete the UPI payment to move your application forward.',
        dueDate: days(3),
        amount: 2500,
        referenceId: 'AMA-2026-002',
      },
      {
        userId: citizen.id,
        type: 'LICENCE_EXPIRY',
        title: 'Driving Licence expiring',
        description: 'Renew your driving licence before it expires.',
        dueDate: days(20),
        referenceId: 'DL-AP-2023-9931',
      },
      {
        userId: citizen.id,
        type: 'DOCUMENT_EXPIRY',
        title: 'Income Certificate validity',
        description: 'The uploaded income certificate will expire soon.',
        dueDate: days(45),
        referenceId: 'INC-AP-2025-5512',
      },
      {
        userId: citizen2.id,
        type: 'APPLICATION_ACTION',
        title: 'Upload corrected site plan',
        description: 'Your water connection application needs a corrected document.',
        dueDate: days(5),
        referenceId: 'AMA-2026-004',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: citizen.id,
        type: 'DUE_DATE',
        title: 'Property tax due in 7 days',
        message: 'Your property tax instalment of ₹4,200 is due on ' + days(7).toDateString() + '. Pay now to avoid a late fee.',
        link: '/app/payments',
      },
      {
        userId: citizen.id,
        type: 'STATUS_UPDATE',
        title: 'Application AMA-2026-001 is under review',
        message: 'Your Property Tax Clearance application has moved to officer review.',
        link: '/app/applications',
        isRead: true,
      },
      {
        userId: citizen.id,
        type: 'PAYMENT',
        title: 'Trade Licence fee pending',
        message: '₹2,500 is awaiting UPI payment for application AMA-2026-002.',
        link: '/app/payments',
      },
      {
        userId: citizen.id,
        type: 'GENERAL',
        title: 'Welcome to Amaravati One',
        message: 'Your unified citizen account is ready. Explore services, credentials and payments in one place.',
        isRead: true,
      },
      {
        userId: citizen2.id,
        type: 'STATUS_UPDATE',
        title: 'Correction requested for AMA-2026-004',
        message: 'Please upload a signed and scaled site plan for your water connection application.',
        link: '/app/applications',
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: citizen.id, action: 'APPLICATION_SUBMITTED', entity: 'Application', entityId: app1.id, metadata: { referenceNo: app1.referenceNo }, createdAt: days(-10) },
      { userId: officer.id, action: 'DOCUMENT_VERIFIED', entity: 'Application', entityId: app1.id, metadata: { referenceNo: app1.referenceNo }, createdAt: days(-8) },
      { userId: citizen.id, action: 'PAYMENT_SUCCESS', entity: 'Payment', entityId: pay1.id, metadata: { referenceNo: pay1.referenceNo, amount: 500 }, createdAt: days(-9) },
      { userId: officer.id, action: 'APPLICATION_APPROVED', entity: 'Application', entityId: app3.id, metadata: { referenceNo: app3.referenceNo }, createdAt: days(-20) },
      { userId: citizen.id, action: 'PAYMENT_SUCCESS', entity: 'Payment', entityId: pay3.id, metadata: { referenceNo: pay3.referenceNo, amount: 100 }, createdAt: days(-29) },
    ],
  });

  console.log('Seed complete.');
  console.log('Demo accounts:');
  console.log('  Citizen : citizen@amaravati.one / Citizen@123');
  console.log('  Citizen : priya@amaravati.one / Citizen@123');
  console.log('  Officer : officer@amaravati.one / Officer@123');
  console.log('  Officer : officer2@amaravati.one / Officer@123');
  console.log('  Admin   : admin@amaravati.one / Admin@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
