import React from 'react';

import {
    useHistory,
    useLocation,
} from 'react-router-dom';
import { generate } from 'shortid';
import { MenuOutlined } from '@ant-design/icons';


import { prefixCls } from '../_util/common';
import getRouteConfig from '../../config';
import { useMediaQuery } from 'react-responsive';

const SiderLi: React.FC<{title: string, path: string}> = ({ title, path }) => {
    const history = useHistory();
    const location = useLocation();

    return (
        <li
            className={
                location.pathname === path ? `${prefixCls}-body-select` : ''
            }
            onClick={() => {
                history.push(path);
            }}
        >
            <a>{title}</a>
        </li>
    );
};

/**
 * 转换当前的导航信息
 */
const Sider = () => {
    const location = useLocation();
    let currentNav;
    getRouteConfig().forEach((nav) => {
        const pathname = location.pathname;
        nav.menus?.some((menu) => {
            if (menu.pages) {
                return menu.pages.some((page) => {
                    if (page.path === pathname) {
                        currentNav = nav;
                        return true;
                    }
                    return false;
                });
            } else {
                if (menu.path === pathname) {
                    currentNav = nav;
                    return true;
                }
            }
        });
    });

    const menuDom = [];
    currentNav?.menus?.forEach((menu) => {
        if (menu.pages) {
            menuDom.push(<div key={generate()}>{menu.title}</div>);
            menu.pages.forEach((page) => {
                menuDom.push(
                    <SiderLi
                        title={page.title}
                        path={page.path}
                        key={generate()}
                    />,
                );
            });
        } else {
            menuDom.push(
                <SiderLi
                    title={menu.title}
                    path={menu.path}
                    key={generate()}
                />,
            );
        }
    });

    const isRetract = useMediaQuery({
        query: '(max-width: 992px)'
    })

    if (isRetract) {
        return (
            <div className={`${prefixCls}-drawer-handle`} >
                <MenuOutlined />
            </div>
        )
    }

    return (
        <div className={`${prefixCls}-body-sider`}>
            <ul>{menuDom}</ul>;
        </div>
    )
};

export default Sider;
