// FIX: Switched to namespace import for react-router-dom to address module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';

interface Breadcrumb {
    name: string;
    path: string;
}

const useBreadcrumbs = (): Breadcrumb[] => {
    const location = ReactRouterDOM.useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    const breadcrumbs: Breadcrumb[] = [{ name: 'Dashboard', path: '/' }];

    pathnames.forEach((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        // Replace dashes with spaces and capitalize words for better display
        const name = value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        breadcrumbs.push({ name, path: to });
    });

    return breadcrumbs;
};

export default useBreadcrumbs;