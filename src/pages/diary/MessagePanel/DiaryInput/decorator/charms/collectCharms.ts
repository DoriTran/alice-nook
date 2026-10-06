import type { MessageDecorator } from '@/store/diary/type';

import type { Charm, ComposerContext } from './charm.types';

import { getDecoratorDefinition } from '../decoratorRegistry';

export const collectCharms = (
  decorators: MessageDecorator[],
  ctx: ComposerContext,
): Charm[] => {
  const charms: Charm[] = [];

  decorators.forEach((decoration, decoratorIndex) => {
    const definition = getDecoratorDefinition(decoration.type);
    if (!definition) {
      return;
    }

    charms.push(...definition.createCharms(decoration, decoratorIndex, ctx));
  });

  return charms;
};
