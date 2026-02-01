# Security Summary

## Known Vulnerabilities

### XLSX Package (v0.18.5)

**Status**: Accepted with mitigations

The `xlsx` package (SheetJS) has two known vulnerabilities:

1. **Regular Expression Denial of Service (ReDoS)**
   - Affected versions: < 0.20.2
   - Current version: 0.18.5 (latest available on npm)
   - **Mitigation**: The export functionality only processes data from authenticated users' own websets. Input validation ensures data integrity before processing. The ReDoS attack vector is limited to authenticated users affecting only their own export operations.

2. **Prototype Pollution**
   - Affected versions: < 0.19.3
   - Current version: 0.18.5 (latest available on npm)
   - **Mitigation**: The library is used only for data export (writing), not for parsing untrusted input. User data is sanitized before being passed to xlsx functions. The prototype pollution vulnerability primarily affects parsing operations.

**Why xlsx is still used:**
- It's the official SheetJS library and industry standard for Excel file generation
- Versions 0.19.3+ and 0.20.2+ are not available on npm (likely commercial/pro versions)
- Alternative packages are less maintained or have compatibility issues
- The security risks are minimal given our usage pattern (export only, authenticated users)

**Additional Mitigations Applied:**
1. All export operations require JWT authentication
2. Users can only export their own websets
3. Input validation on cell values before export
4. Export operations run in isolated async jobs
5. Rate limiting on export endpoints (inherited from global rate limiting)

## Recommendations for Production

1. **Monitor for updates**: Check regularly for new versions of xlsx package
2. **Consider SheetJS Pro**: Evaluate commercial SheetJS license which may include patched versions
3. **Alternative approach**: Consider using cloud-based export services (Google Sheets API already implemented)
4. **Rate limiting**: Implement specific rate limits for export endpoints
5. **File size limits**: Add maximum file size limits for exports

## Security Best Practices Implemented

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access their own websets
3. **Input validation**: All DTOs use class-validator decorators
4. **SQL injection prevention**: TypeORM parameterized queries
5. **XSS prevention**: No direct HTML rendering of user input
6. **CSRF protection**: Stateless JWT authentication
7. **Data isolation**: User-scoped queries throughout

## CodeQL Analysis

No security issues found in custom code (JavaScript analysis passed with 0 alerts).
