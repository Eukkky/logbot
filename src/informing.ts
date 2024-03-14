import { Colors, EmbedBuilder, TextChannel } from "discord.js";

export const informMemberLeft = async (
  channel: TextChannel,
  userId: string
) => {
  const embed = new EmbedBuilder().setColor(Colors.White).addFields([
    {
      name: "Użytkownik",
      value: `<@${userId}>`,
      inline: false,
    },
  ]);

  await channel.send({ embeds: [embed] });
};

export const informAboutModerationAction = async (
  action: string,
  channel: TextChannel,
  targetId: string,
  executorId: string,
  reason: string | null
) => {
  const embed = new EmbedBuilder().setColor(Colors.White).addFields([
    {
      name: "Akcja",
      value: action,
    },
    {
      name: "Powód",
      value: reason ?? "Nie podano",
      inline: true,
    },
    {
      name: "Użytkownik",
      value: `<@${targetId}>`,
    },
    {
      name: "Przez",
      value: `<@${executorId}>`,
    },
  ]);

  channel.send({ embeds: [embed] });
};
