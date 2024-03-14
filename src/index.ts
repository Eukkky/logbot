import { Client, AuditLogEvent, Guild, TextChannel, User } from "discord.js";
import { informMemberLeft, informAboutModerationAction } from "./informing.js";

const client = new Client({
  intents: ["Guilds", "GuildBans", "GuildMembers", "GuildModeration"],
});

const hasBeenKickedOrBannedNow = async (memberId: string, guild: Guild) =>
  new Promise<{
    result: boolean;
    reason: string | null;
    userDidThis: User | null;
  }>(async (resolve) => {
    const fetchedKickLogs = await guild.fetchAuditLogs({
      limit: 5,
      type: AuditLogEvent.MemberKick,
    });

    const fetchedBanLogs = await guild.fetchAuditLogs({
      limit: 5,
      type: AuditLogEvent.MemberBanAdd,
    });

    for (const [_, entry] of [
      ...fetchedKickLogs.entries,
      ...fetchedBanLogs.entries,
    ]) {
      let date10SecsAgo = new Date();
      date10SecsAgo.setTime(date10SecsAgo.getTime() - 10000);

      if (entry.target?.id === memberId && entry.createdAt > date10SecsAgo) {
        resolve({
          result: true,
          reason: entry.reason,
          userDidThis: entry.executor,
        }); // sometimes it may lie, I have chose just technically easiest way
        break;
      }
    }

    resolve({ result: false, reason: null, userDidThis: null });
  });

client.on("ready", async () => {
  console.log("bot is up as " + client.user!.tag);

  const guild = await client.guilds.fetch("");

  if (guild === undefined)
    throw new Error("Voluntary members exits channel not found.");

  const voluntaryMembersExitsChannel = await guild.channels.fetch("");
  const banKicksMutesChannel = await guild.channels.fetch("");

  if (voluntaryMembersExitsChannel === undefined)
    throw new Error("Voluntary members exits channel not found.");

  if (banKicksMutesChannel === undefined)
    throw new Error("Ban-kicks-mutes channel not found.");

  client.on("guildMemberRemove", async (member) => {
    const hasBeenKickedOrbanned = await hasBeenKickedOrBannedNow(
      member.id,
      guild
    );

    if (hasBeenKickedOrbanned.result === false)
      await informMemberLeft(
        voluntaryMembersExitsChannel as TextChannel,
        member.id
      );
  });

  client.on("guildAuditLogEntryCreate", async (auditLogEntry) => {
    if (auditLogEntry.action === AuditLogEvent.MemberKick) {
      await informAboutModerationAction(
        "Wyrzucenie",
        banKicksMutesChannel as TextChannel,
        auditLogEntry.targetId!,
        auditLogEntry.executorId!,
        auditLogEntry.reason
      );
    } else if (auditLogEntry.action === AuditLogEvent.MemberBanAdd) {
      await informAboutModerationAction(
        "Zbanowanie",
        banKicksMutesChannel as TextChannel,
        auditLogEntry.targetId!,
        auditLogEntry.executorId!,
        auditLogEntry.reason
      );
    } else if (auditLogEntry.action === AuditLogEvent.MemberBanRemove) {
      await informAboutModerationAction(
        "Odbanowanie",
        banKicksMutesChannel as TextChannel,
        auditLogEntry.targetId!,
        auditLogEntry.executorId!,
        null
      );
    }
  });
});

await client.login("");
