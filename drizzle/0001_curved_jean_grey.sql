CREATE TABLE "config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"budget_cap" integer DEFAULT 100 NOT NULL,
	"ownership_cap_pct" integer DEFAULT 100 NOT NULL,
	"deadline_at" timestamp,
	"transfers_enabled" boolean DEFAULT false NOT NULL,
	"transfers_per_gameweek" integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" text PRIMARY KEY NOT NULL,
	"home_team_id" text NOT NULL,
	"away_team_id" text NOT NULL,
	"kickoff_at" timestamp NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"gameweek" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "national_team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'in' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nation_id" text NOT NULL,
	"position" text NOT NULL,
	"value" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_match_score" (
	"player_id" text NOT NULL,
	"match_id" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "player_match_score_player_id_match_id_pk" PRIMARY KEY("player_id","match_id")
);
--> statement-breakpoint
CREATE TABLE "player_match_stat" (
	"player_id" text NOT NULL,
	"match_id" text NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"clean_sheet" boolean DEFAULT false NOT NULL,
	"yellows" integer DEFAULT 0 NOT NULL,
	"reds" integer DEFAULT 0 NOT NULL,
	"motm" boolean DEFAULT false NOT NULL,
	CONSTRAINT "player_match_stat_player_id_match_id_pk" PRIMARY KEY("player_id","match_id")
);
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "total_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "team_selection" ADD COLUMN "purchase_value" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_home_team_id_national_team_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."national_team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_away_team_id_national_team_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."national_team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_nation_id_national_team_id_fk" FOREIGN KEY ("nation_id") REFERENCES "public"."national_team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_score" ADD CONSTRAINT "player_match_score_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_score" ADD CONSTRAINT "player_match_score_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stat" ADD CONSTRAINT "player_match_stat_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_match_stat" ADD CONSTRAINT "player_match_stat_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_selection" ADD CONSTRAINT "team_selection_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE no action ON UPDATE no action;