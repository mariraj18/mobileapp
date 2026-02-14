module.exports = (sequelize, DataTypes) => {
    const TaskJob = sequelize.define(
        'TaskJob',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            data: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
                defaultValue: 'PENDING',
            },
            error: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            attempts: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            last_attempt_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            completed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: 'task_jobs',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return TaskJob;
};
