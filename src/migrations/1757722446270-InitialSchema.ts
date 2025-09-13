import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1757722446270 implements MigrationInterface {
    name = 'InitialSchema1757722446270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."house_memberships_role_enum" AS ENUM('admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "password" character varying NOT NULL, "phoneNumber" character varying, "isActive" boolean NOT NULL DEFAULT true, "profileImageUrl" character varying, "color" character varying NOT NULL DEFAULT '#6366F1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "houses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying, "description" character varying, "inviteCode" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "imageUrl" character varying, "color" character varying NOT NULL DEFAULT '#10B981', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "primaryShoppingListId" uuid, CONSTRAINT "UQ_fb4364b07e080e10820b0b281b8" UNIQUE ("inviteCode"), CONSTRAINT "REL_2d4dfa5b1815b36c7081cea4a5" UNIQUE ("primaryShoppingListId"), CONSTRAINT "PK_ee6cacb502a4b8590005eb3dc8d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "house_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "displayName" character varying NOT NULL, "role" "public"."house_memberships_role_enum" NOT NULL DEFAULT 'member', "isActive" boolean NOT NULL DEFAULT true, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "houseId" uuid NOT NULL, CONSTRAINT "UQ_7a05d3a0c272f4c659792ab7bd0" UNIQUE ("userId", "houseId"), CONSTRAINT "UQ_f1855356b48e07245d9b1e471d7" UNIQUE ("houseId", "displayName"), CONSTRAINT "PK_bb74d2e5ea285582eddfe7b1283" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "color" character varying NOT NULL DEFAULT '#6B7280', "icon" character varying, "isActive" boolean NOT NULL DEFAULT true, "isDefault" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "houseId" uuid NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "expenseDate" date NOT NULL, "receiptUrl" character varying, "splitBetween" uuid array NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "paidById" uuid NOT NULL, "houseId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "memo" character varying, "paymentDate" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "fromUserId" uuid NOT NULL, "toUserId" uuid NOT NULL, "houseId" uuid NOT NULL, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "balances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user1Id" uuid NOT NULL, "user2Id" uuid NOT NULL, "houseId" uuid NOT NULL, CONSTRAINT "UQ_035bc9bd06e3552d9e407827cc2" UNIQUE ("houseId", "user1Id", "user2Id"), CONSTRAINT "PK_74904758e813e401abc3d4261c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shopping_lists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL DEFAULT 'Shopping List', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "houseId" uuid, CONSTRAINT "PK_9289ace7dd5e768d65290f3f9de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shopping_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "quantity" numeric(8,2) NOT NULL DEFAULT '1', "notes" character varying, "purchasedAt" TIMESTAMP, "isRecurring" boolean NOT NULL DEFAULT false, "recurringInterval" integer, "lastRecurredAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "shoppingListId" uuid NOT NULL, "categoryId" uuid, "assignedToId" uuid, "purchasedById" uuid, CONSTRAINT "PK_36f295ec7314c9001968ca2c6f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "houses" ADD CONSTRAINT "FK_2d4dfa5b1815b36c7081cea4a5d" FOREIGN KEY ("primaryShoppingListId") REFERENCES "shopping_lists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "house_memberships" ADD CONSTRAINT "FK_325acfc8ec2d88cd88dcda2abde" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "house_memberships" ADD CONSTRAINT "FK_6e4a82ebab657883aff613553fb" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_2ae114dd722665ae8c796179039" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_4fc790f36a2fdea59615b61a3a3" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_4637566da1c5a1af8a5b688a556" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_e70879230925c0b8d7c0148ea42" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_8b22c286a7aa80a74ab47db1c36" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_917aef8c9471e4ab91d73cc3551" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balances" ADD CONSTRAINT "FK_107eb1f4ebf044335661db36393" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balances" ADD CONSTRAINT "FK_e5854fbb57b6a80c9a6c77a1f02" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balances" ADD CONSTRAINT "FK_d4fcec8d6440ac3b69882456c54" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_lists" ADD CONSTRAINT "FK_004f6baec27f1d66588da46ff84" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_items" ADD CONSTRAINT "FK_344f8b696534369e99b18860e77" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_items" ADD CONSTRAINT "FK_b602a05b92f82e13d3ec136e849" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_items" ADD CONSTRAINT "FK_9985abece016eb04564f2c81756" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_items" ADD CONSTRAINT "FK_a530353b33de6d18ec910cb6cea" FOREIGN KEY ("purchasedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shopping_items" DROP CONSTRAINT "FK_a530353b33de6d18ec910cb6cea"`);
        await queryRunner.query(`ALTER TABLE "shopping_items" DROP CONSTRAINT "FK_9985abece016eb04564f2c81756"`);
        await queryRunner.query(`ALTER TABLE "shopping_items" DROP CONSTRAINT "FK_b602a05b92f82e13d3ec136e849"`);
        await queryRunner.query(`ALTER TABLE "shopping_items" DROP CONSTRAINT "FK_344f8b696534369e99b18860e77"`);
        await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT "FK_004f6baec27f1d66588da46ff84"`);
        await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_d4fcec8d6440ac3b69882456c54"`);
        await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_e5854fbb57b6a80c9a6c77a1f02"`);
        await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_107eb1f4ebf044335661db36393"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_917aef8c9471e4ab91d73cc3551"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_8b22c286a7aa80a74ab47db1c36"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_e70879230925c0b8d7c0148ea42"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_4637566da1c5a1af8a5b688a556"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_4fc790f36a2fdea59615b61a3a3"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_2ae114dd722665ae8c796179039"`);
        await queryRunner.query(`ALTER TABLE "house_memberships" DROP CONSTRAINT "FK_6e4a82ebab657883aff613553fb"`);
        await queryRunner.query(`ALTER TABLE "house_memberships" DROP CONSTRAINT "FK_325acfc8ec2d88cd88dcda2abde"`);
        await queryRunner.query(`ALTER TABLE "houses" DROP CONSTRAINT "FK_2d4dfa5b1815b36c7081cea4a5d"`);
        await queryRunner.query(`DROP TABLE "shopping_items"`);
        await queryRunner.query(`DROP TABLE "shopping_lists"`);
        await queryRunner.query(`DROP TABLE "balances"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "house_memberships"`);
        await queryRunner.query(`DROP TABLE "houses"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."house_memberships_role_enum"`);
    }

}
