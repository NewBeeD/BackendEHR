// prisma/schema.prisma - Add this model
/*
model AuditLog {
  id          String   @id @default(cuid())
  action      String   // CREATE, READ, UPDATE, DELETE, LOGIN, etc.
  resource    String   // Patient, MedicalRecord, etc.
  resourceId  String?
  userId      String
  userEmail   String
  userRole    UserRole
  ipAddress   String?
  userAgent   String?
  oldValues   Json?
  newValues   Json?
  timestamp   DateTime @default(now())
  severity    AuditLogSeverity @default(Info) // Info, Warning, Critical
  description String?

  user        User     @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}

enum AuditLogSeverity {
  Info
  Warning
  Critical
}
*/