import {
    readdirSync,
    readFileSync,
    writeFileSync,
    statSync,
    Stats,
} from 'fs-extra';
import yaml from 'js-yaml';
import { join, sep } from 'path';

interface Page {
    // 标题
    title: string;
    // 序号
    order?: number;
    // 当前组件信息
    component: string;
    // 组件访问路径
    path: string;
}

interface MenuGroup {
    title: string;
    pages: Page[];
}

interface Nav {
    // 标题
    title: string;
    // 序号
    order?: number;
    // 当前节点下的菜单信息
    menus: (MenuGroup | Page)[];
}

// 递归获取文件目录
export const findRecursionFiles = (
    path: string,
    callback: (file: string, stats: Stats) => void,
) => {
    const dir = readdirSync(path);
    dir.forEach((file) => {
        if (['node_modules'].includes(file)) {
            return;
        }
        const realFile = join(path, file);
        const stat = statSync(realFile);
        if (stat.isDirectory()) {
            findRecursionFiles(realFile, callback);
        } else {
            callback(realFile, stat);
        }
    });
};

// 查找对应的md的文件, 然后根据文件来生成对应的目录结构信息, 应该采用递归的方式进行获取
export const findFile = () => {
    const mdFiles: string[] = [];
    findRecursionFiles(process.cwd(), (path) => {
        if (path.match(/\.md(x?)$/)) {
            mdFiles.push(path);
        }
    });
    return mdFiles;
};

const getMarkdownConfig = (file: string) => {
    const mdInfo = /^<!--+[\W\w]+?--+>/i.exec(readFileSync(file, 'utf8'));
    if (mdInfo && mdInfo?.length > 0) {
        return yaml.safeLoad(
            mdInfo![0].replace(/<!--+/g, '').replace(/--+>/g, ''),
        ) as {
            nav: {
                title: string;
                order?: number;
            };
            group: {
                title: string;
                order?: number;
            };
            title: string;
            order?: number;
        };
    }
    return null;
};

// 找到当前的路由信息，并生成navs信息
export const findFileToNavs = () => {
    const files = findFile();
    const navs: Nav[] = [];
    files.forEach((file) => {
        const yml = getMarkdownConfig(file);
        // 未找到yum 信息直接return
        if (!yml) return;

        const pagePath = `/${
            /[0-9a-zA-Z/_\\-]+/g.exec(
                file.replace(join(process.cwd(), 'src'), ''),
            )![0]
        }`.split(sep);
        let realPath = `${pagePath
            .filter((path) => !['', '/', '\\'].includes(path))
            .join('/')}`;
        if (realPath[0] !== '/') {
            realPath = `/${realPath}`;
        }
        const page: Page = {
            title: yml.title,
            component: `/*@free-kits/component import*/..${file.replace(
                process.cwd(),
                '',
            )}/*@free-kits/component import-end*/`,
            path: realPath,
            order: yml.order,
        };

        const filterNavs = navs.filter((ele) => ele.title === yml.nav.title);

        // 如果 nav中存在相同的数据
        if (filterNavs.length > 0) {
            // 如果数据结构中存在对应的nav信息，则直接添加
            const nav = filterNavs[0];
            const instanceOfMenuGroup = (object: any): object is MenuGroup => 'pages' in object;
            const menusFilter = nav.menus.filter(
                (menu) => instanceOfMenuGroup(menu) && menu.title === yml.group.title,
            );

            if (menusFilter.length > 0) {
                if (yml.group) {
                    if (
                        // 如果存在group, 则添加到对应group的pages
                        instanceOfMenuGroup(menusFilter[0]) && menusFilter[0].pages
                    ) {
                        menusFilter[0].pages.push(page);
                    } else {
                        // 否则没有group存在, 手动新建一个group
                        nav.menus.push({
                            title: yml.group.title,
                            pages: [page],
                        });
                    }
                } else {
                    nav.menus.push(page);
                }
            } else if (yml.group) {
                nav.menus.push({
                    title: yml.group.title,
                    pages: [page],
                });
            } else {
                nav.menus.push(page);
            }
        } else {
            // 不存在对应的nav信息，则添加
            const addNav: Nav = {
                title: yml.nav.title,
                order: yml.nav.order,
                menus: [],
            };
            if (yml.group) {
                // 判断group 是否存在菜单中
                addNav.menus.push({
                    title: yml.group.title,
                    order: yml.group.order,
                    pages: [page],
                });
            } else {
                addNav.menus.push(page);
            }

            navs.push(addNav);
        }
    });
    return navs;
};

// 生成对应的文件信息
export const createRouteConfig = () => {
    const navs = findFileToNavs();
    const code = JSON.stringify(navs)
        .replace(/"/g, "'")
        .replace(
            /'\/\*@free-kits\/component\s+import\*\//g,
            "React.lazy(() => import('",
        )
        .replace(/\/\*@free-kits\/component\s+import-end\*\/'/g, "'))")
        .replace(/\s*\\\\/g, '/');
    writeFileSync(
        join(process.cwd(), '.doc', 'config.ts'),
        `import React from 'react';\nexport default () => ${code}`,
    );
};
