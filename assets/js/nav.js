(function () {
    const NAV_BREAKPOINT = 767;

    const closeMenu = (toggle, menu) => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('nav-menu--open');
    };

    const initNav = () => {
        const navContainers = document.querySelectorAll('.nav-container');

        navContainers.forEach((container) => {
            const toggle = container.querySelector('.nav-toggle');
            const menu = container.querySelector('.nav-menu');

            if (!toggle || !menu) {
                return;
            }

            toggle.addEventListener('click', () => {
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', String(!isExpanded));
                menu.classList.toggle('nav-menu--open', !isExpanded);
            });

            menu.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => {
                    if (window.matchMedia(`(max-width: ${NAV_BREAKPOINT}px)`).matches) {
                        closeMenu(toggle, menu);
                    }
                });
            });

            window.addEventListener('resize', () => {
                if (!window.matchMedia(`(max-width: ${NAV_BREAKPOINT}px)`).matches) {
                    closeMenu(toggle, menu);
                }
            });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
})();





