
// Diagnostic Endpoint to check DB schema and permissions
app.get('/api/diagnose-db', async (req, res) => {
    if (!checkDb(res)) return;

    try {
        // 1. Get sample data and column names
        const { data: errorSample, error: sampleError } = await supabase
            .from('errors')
            .select('*')
            .limit(1);

        if (sampleError) throw sampleError;

        const columns = errorSample && errorSample.length > 0 ? Object.keys(errorSample[0]) : [];
        
        // 2. Check if a view increment would work (Simulation)
        const sampleId = errorSample && errorSample.length > 0 ? errorSample[0].id : null;

        res.json({
            status: 'success',
            database: 'connected',
            errors_table_columns: columns,
            sample_data_present: !!sampleId,
            env: {
                has_url: !!process.env.SUPABASE_URL,
                has_key: !!process.env.SUPABASE_KEY,
                has_admin_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});
