import { ColorResolvable } from 'discord.js';

export default {
  ms: {
    day: 86_400_000,
    hour: 3_600_000,
    minute: 60_000,
    second: 1000,
  },
  color: {
    error: '#AA0000' as ColorResolvable,
    warning: '#FF5555' as ColorResolvable,
    normal: '#7289DA' as ColorResolvable,
    on: '#00AA00' as ColorResolvable,
    off: '#555555' as ColorResolvable,
  },
};