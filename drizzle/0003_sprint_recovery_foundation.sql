CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "encounter_appointment_id_unique" UNIQUE("appointment_id"),
	CONSTRAINT "encounter_status_check" CHECK ("encounter"."status" in ('in_progress', 'completed')),
	CONSTRAINT "encounter_completion_check" CHECK (("encounter"."status" = 'completed') = ("encounter"."ended_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "medicine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"form" text NOT NULL,
	"strength" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preliminary_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"duration_days" smallint NOT NULL,
	"quantity" integer NOT NULL,
	"instructions" text,
	CONSTRAINT "prescription_item_positive_check" CHECK ("prescription_item"."duration_days" > 0 and "prescription_item"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "prescription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"called_at" timestamp with time zone,
	CONSTRAINT "queue_entry_appointment_id_unique" UNIQUE("appointment_id"),
	CONSTRAINT "queue_entry_status_check" CHECK ("queue_entry"."status" in ('waiting', 'intake_done', 'with_doctor', 'completed'))
);
--> statement-breakpoint
CREATE TABLE "vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"recorded_by" text NOT NULL,
	"bp_systolic" smallint,
	"bp_diastolic" smallint,
	"heart_rate" smallint,
	"respiratory_rate" smallint,
	"temperature_c" numeric(4, 1),
	"spo2" smallint,
	"weight_kg" numeric(5, 1),
	"height_cm" numeric(5, 1),
	"additional" jsonb,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter" ADD CONSTRAINT "encounter_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preliminary_note" ADD CONSTRAINT "preliminary_note_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preliminary_note" ADD CONSTRAINT "preliminary_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_prescription_id_prescription_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescription"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_medicine_id_medicine_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicine"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue_entry" ADD CONSTRAINT "queue_entry_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_encounter_id_encounter_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounter"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "clinical_note_encounter_idx" ON "clinical_note" USING btree ("encounter_id","created_at","id");--> statement-breakpoint
CREATE INDEX "encounter_patient_history_idx" ON "encounter" USING btree ("patient_id","started_at");--> statement-breakpoint
CREATE INDEX "encounter_doctor_idx" ON "encounter" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "medicine_name_idx" ON "medicine" USING btree ("name");--> statement-breakpoint
CREATE INDEX "preliminary_note_encounter_idx" ON "preliminary_note" USING btree ("encounter_id","created_at");--> statement-breakpoint
CREATE INDEX "prescription_item_prescription_idx" ON "prescription_item" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "prescription_encounter_idx" ON "prescription" USING btree ("encounter_id","created_at");--> statement-breakpoint
CREATE INDEX "queue_entry_status_order_idx" ON "queue_entry" USING btree ("status","checked_in_at","id");--> statement-breakpoint
CREATE INDEX "vitals_encounter_idx" ON "vitals" USING btree ("encounter_id");
--> statement-breakpoint
-- SQL-only retention invariant; Drizzle snapshots do not represent triggers.
CREATE FUNCTION carely_reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only' USING ERRCODE = '42501';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only
BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_log
FOR EACH STATEMENT EXECUTE FUNCTION carely_reject_audit_mutation();
