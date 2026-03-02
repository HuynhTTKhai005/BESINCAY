const hasRole = (req, roleName) => {
    return req.user?.role_id?.name === roleName;
};

const requireRoles = (roles, deniedMessage) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Vui lòng đăng nhập để tiếp tục'
                });
            }

            const isAllowed = roles.some((role) => hasRole(req, role));
            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: deniedMessage
                });
            }

            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi xác thực quyền truy cập'
            });
        }
    };
};

const adminMiddleware = requireRoles(
    ['admin'],
    'Không có quyền truy cập. Chỉ admin mới được phép.'
);

const adminOrStaffMiddleware = requireRoles(
    ['admin', 'staff'],
    'Không có quyền truy cập. Chỉ admin hoặc staff mới được phép.'
);

module.exports = { adminMiddleware, adminOrStaffMiddleware };
