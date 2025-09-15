import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetTokens1757914601262 implements MigrationInterface {
    name = 'AddPasswordResetTokens1757914601262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE ("token"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9bfba70726ffca74288d85e6fd" ON "password_reset_tokens" ("userId", "used") `);
        await queryRunner.query(`CREATE INDEX "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens" ("token") `);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ab673f0e63eac966762155508e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9bfba70726ffca74288d85e6fd"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    }

}
