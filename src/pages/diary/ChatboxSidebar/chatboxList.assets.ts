import signature from '@/assets/v2/diary/chatbox-list/signature.png';
import wish from '@/assets/v2/diary/chatbox-list/wish.png';

type AssetModule = { default: string };
type AssetLoader = () => Promise<AssetModule>;

const rabbitModules = import.meta.glob<AssetModule>([
  '../../../assets/v2/diary/chatbox-list/rabbits/*.png',
  '!../../../assets/v2/diary/chatbox-list/rabbits/base.png',
]);

const rabbitLoaders = Object.entries(rabbitModules)
  .filter(([path]) => /\/\d+\.png$/.test(path))
  .sort(([left], [right]) =>
    left.localeCompare(right, undefined, { numeric: true }),
  )
  .map(([, loader]) => loader);

export const pickRandomRabbitLoader = (): AssetLoader | null => {
  if (rabbitLoaders.length === 0) {
    return null;
  }

  return rabbitLoaders[Math.floor(Math.random() * rabbitLoaders.length)];
};

export const chatboxListAssets = { signature, wish } as const;
