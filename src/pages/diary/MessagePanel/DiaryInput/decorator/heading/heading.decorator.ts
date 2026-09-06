import type { DecoratorDefinition } from '../charms/charm.types';

import { createHeadingCharm } from './headingEditorCharm';
import { createHeadingTopLayoutCharm } from './headingTopLayoutCharm';

export const headingDecorator: DecoratorDefinition = {
  createCharms: (_decoration, decoratorIndex) => [
    createHeadingTopLayoutCharm(),
    createHeadingCharm(decoratorIndex),
  ],
};
