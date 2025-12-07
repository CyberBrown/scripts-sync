import chalk from 'chalk';

const VERSION = '0.1.0';

export const LOGOS_FLUX_BANNER = `
${chalk.magentaBright('        ██╗      ██████╗  ██████╗  ██████╗ ███████╗')}
${chalk.magentaBright('        ██║     ██╔═══██╗██╔════╝ ██╔═══██╗██╔════╝')}
${chalk.magenta('        ██║     ██║   ██║██║  ███╗██║   ██║███████╗')}
${chalk.magenta('        ██║     ██║   ██║██║   ██║██║   ██║╚════██║')}
${chalk.magenta('        ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████║')}
${chalk.magenta('        ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝')}

${chalk.cyanBright('                ███████╗██╗     ██╗   ██╗██╗  ██╗')}
${chalk.cyanBright('                ██╔════╝██║     ██║   ██║╚██╗██╔╝')}
${chalk.cyan('                █████╗  ██║     ██║   ██║ ╚███╔╝ ')}
${chalk.cyan('                ██╔══╝  ██║     ██║   ██║ ██╔██╗ ')}
${chalk.cyan('                ██║     ███████╗╚██████╔╝██╔╝ ██╗')}
${chalk.cyan('                ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝')}

${chalk.dim('                           Φ⥁○⧖∵')}
`;

export const BANNER_LARGE = LOGOS_FLUX_BANNER;

export const BANNER_SMALL = `
${chalk.cyan('┌─────────────────────────────────────┐')}
${chalk.cyan('│')}  ${chalk.yellow('⚡')} ${chalk.bold.white('Scripts Sync')} ${chalk.dim('by Logos Flux')}    ${chalk.cyan('│')}
${chalk.cyan('└─────────────────────────────────────┘')}
`;

export const BANNER_INSTALL = `
${chalk.magentaBright('        ██╗      ██████╗  ██████╗  ██████╗ ███████╗')}
${chalk.magentaBright('        ██║     ██╔═══██╗██╔════╝ ██╔═══██╗██╔════╝')}
${chalk.magenta('        ██║     ██║   ██║██║  ███╗██║   ██║███████╗')}
${chalk.magenta('        ██║     ██║   ██║██║   ██║██║   ██║╚════██║')}
${chalk.magenta('        ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████║')}
${chalk.magenta('        ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝')}

${chalk.cyanBright('                ███████╗██╗     ██╗   ██╗██╗  ██╗')}
${chalk.cyanBright('                ██╔════╝██║     ██║   ██║╚██╗██╔╝')}
${chalk.cyan('                █████╗  ██║     ██║   ██║ ╚███╔╝ ')}
${chalk.cyan('                ██╔══╝  ██║     ██║   ██║ ██╔██╗ ')}
${chalk.cyan('                ██║     ███████╗╚██████╔╝██╔╝ ██╗')}
${chalk.cyan('                ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝')}

${chalk.dim('                           Φ⥁○⧖∵')}

${chalk.dim(`                    ⚡ scripts-sync v${VERSION} ⚡`)}
${chalk.green.bold('                        INSTALLED')}
`;

export const BANNER_UPDATE = `
${chalk.magentaBright('        ██╗      ██████╗  ██████╗  ██████╗ ███████╗')}
${chalk.magentaBright('        ██║     ██╔═══██╗██╔════╝ ██╔═══██╗██╔════╝')}
${chalk.magenta('        ██║     ██║   ██║██║  ███╗██║   ██║███████╗')}
${chalk.magenta('        ██║     ██║   ██║██║   ██║██║   ██║╚════██║')}
${chalk.magenta('        ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████║')}
${chalk.magenta('        ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝')}

${chalk.cyanBright('                ███████╗██╗     ██╗   ██╗██╗  ██╗')}
${chalk.cyanBright('                ██╔════╝██║     ██║   ██║╚██╗██╔╝')}
${chalk.cyan('                █████╗  ██║     ██║   ██║ ╚███╔╝ ')}
${chalk.cyan('                ██╔══╝  ██║     ██║   ██║ ██╔██╗ ')}
${chalk.cyan('                ██║     ███████╗╚██████╔╝██╔╝ ██╗')}
${chalk.cyan('                ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝')}

${chalk.dim('                           Φ⥁○⧖∵')}

${chalk.dim(`                    ⚡ scripts-sync v${VERSION} ⚡`)}
${chalk.blue.bold('                         UPDATED')}
`;

export function printBanner(type: 'large' | 'small' | 'install' | 'update' = 'small'): void {
  switch (type) {
    case 'large':
      console.log(BANNER_LARGE);
      break;
    case 'install':
      console.log(BANNER_INSTALL);
      break;
    case 'update':
      console.log(BANNER_UPDATE);
      break;
    default:
      console.log(BANNER_SMALL);
  }
}
