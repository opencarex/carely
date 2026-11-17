CREATE TYPE "public"."prescription_status" AS ENUM('issued', 'dispensed');--> statement-breakpoint
CREATE TABLE "dispense_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"dispensed_by" text NOT NULL,
	"dispensed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medicine_id" uuid NOT NULL,
	"batch_no" text NOT NULL,
	"expiry_date" date NOT NULL,
	"quantity_on_hand" integer NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_batch_quantity_nonnegative" CHECK ("stock_batch"."quantity_on_hand" >= 0)
);
--> statement-breakpoint
CREATE TABLE "visit_reason" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"specialty_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "visit_reason_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Preserve the issued status already used by the application. Unknown legacy
-- statuses intentionally fail the cast; never silently rewrite clinical data.
ALTER TABLE "prescription" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "prescription" ALTER COLUMN "status" SET DATA TYPE "public"."prescription_status" USING "status"::"public"."prescription_status";--> statement-breakpoint
ALTER TABLE "prescription" ALTER COLUMN "status" SET DEFAULT 'issued'::"public"."prescription_status";--> statement-breakpoint
ALTER TABLE "dispense_record" ADD CONSTRAINT "dispense_record_prescription_id_prescription_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescription"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispense_record" ADD CONSTRAINT "dispense_record_dispensed_by_user_id_fk" FOREIGN KEY ("dispensed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batch" ADD CONSTRAINT "stock_batch_medicine_id_medicine_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicine"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_reason" ADD CONSTRAINT "visit_reason_specialty_id_specialty_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialty"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_visit_reason_id_visit_reason_id_fk" FOREIGN KEY ("visit_reason_id") REFERENCES "public"."visit_reason"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "prescription_item" ALTER COLUMN "medicine_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_item" ADD COLUMN "medicine_name" text;--> statement-breakpoint
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_medicine_source_check" CHECK (("prescription_item"."medicine_id" IS NOT NULL) <> ("prescription_item"."medicine_name" IS NOT NULL));