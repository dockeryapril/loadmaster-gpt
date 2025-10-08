# Test Fixtures

This directory contains real-world load board document samples used for comprehensive OCR testing.

## Real-World Document Fixtures

### Load Board Offer Format
- **Type**: Standard load board offer display
- **Key Fields**: Pro number, origin/destination, miles, weight, rate
- **Example Data**: 817 miles, $1,405.24, TOPEKA,IN → CANTON,MS
- **Expected RPM**: ~$1.72/mile

### Detailed Load Board Display
- **Type**: Comprehensive load board with shipper/consignee details
- **Key Fields**: Complete addresses, mileage breakdown, weight, rate, timing
- **Example Data**: 76 loaded miles, $295.52, CHESTERTON,IN → DES PLAINES,IL
- **Expected RPM**: ~$3.89/mile

### Email Load Offer
- **Type**: Carrier sales email with load details
- **Key Fields**: Origin/destination, target rate, cargo dimensions, contact info
- **Example Data**: AYER,MA → LOCKBOURNE,OH, $600 target
- **Special**: Requires mileage calculation (not provided in document)

### Pickup/Delivery Sheet
- **Type**: Local delivery documentation
- **Key Fields**: Pickup/delivery addresses, weight, total price, timing
- **Example Data**: MIAMI,FL → FORT LAUDERDALE,FL, 50 lbs, $200
- **Expected RPM**: High (local/short haul)

## Usage in Tests

These fixtures are used in `realWorldOCR.test.ts` to:

1. **Validate OCR Accuracy**: Test field extraction against real document formats
2. **Test Business Logic**: Calculate RPM and apply business setup scenarios  
3. **Performance Testing**: Ensure processing speed meets expectations
4. **Error Handling**: Test with incomplete or conflicting information
5. **Format Recognition**: Classify different document types automatically

## Expected Test Coverage

- ✅ Standard load board formats (DAT, Truckstop, etc.)
- ✅ Email-based load offers  
- ✅ Pickup/delivery sheets
- ✅ Rate confirmations with detailed breakdowns
- ✅ Documents with missing critical information
- ✅ Multi-format field variations (rates, locations, weights)

## Business Logic Validation

The fixtures test realistic scenarios:
- **Long haul**: 500+ miles, typically $1.50-$2.50/mile
- **Regional**: 100-500 miles, typically $2.00-$4.00/mile  
- **Local**: <100 miles, typically $3.00-$8.00/mile

Each scenario validates business setup calculations for different operator types (company driver, lease operator, independent contractor).