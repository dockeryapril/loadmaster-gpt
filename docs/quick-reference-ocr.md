# OCR Tips & Troubleshooting - Quick Reference

**📸 Get Perfect OCR Results Every Time**

---

## 📱 Perfect Screenshot Checklist

### ✅ Before Taking Screenshot
- [ ] **Good lighting** - Natural light or bright room
- [ ] **Clean screen** - No smudges or glare
- [ ] **100% zoom** - No browser zoom in/out
- [ ] **Steady hands** - Avoid camera shake

### ✅ Image Composition  
- [ ] **Crop tight** - Show only load information
- [ ] **Text readable** - You can read it clearly
- [ ] **Full fields visible** - Don't cut off numbers
- [ ] **No overlapping windows** - Close popups/notifications

### ✅ File Requirements
- [ ] **Format:** JPG, PNG, or WebP
- [ ] **Size:** Under 10MB (smaller = faster)
- [ ] **Resolution:** At least 300px wide
- [ ] **Quality:** High setting on phone camera

---

## 🎯 Load Board Specific Tips

### DAT Power
- **✅ Best:** Rate confirmation screen
- **⚠️ Avoid:** Search results (too much extra text)
- **💡 Tip:** Scroll to show all load details

### Truckstop.com  
- **✅ Best:** Load details page
- **⚠️ Avoid:** List view screenshots
- **💡 Tip:** Ensure rate and miles are visible

### Sylectus
- **✅ Best:** Load tender screen
- **⚠️ Avoid:** Blended search results
- **💡 Tip:** Include pickup/delivery info

### Email Screenshots
- **✅ Best:** Rate confirmation emails
- **⚠️ Avoid:** Email threads (too much text)
- **💡 Tip:** Forward important emails to clean format

---

## 🔍 Field Detection Guide

### What OCR Finds Easily ✅
- **Rate:** `$1,234.56`, `TOTAL: $1500`, `AMOUNT $1,200`
- **Miles:** `500 miles`, `617 mi`, `Distance: 234`
- **Cities:** `Dallas, TX to Houston, TX`
- **Weight:** `15,000 lbs`, `Weight: 8,500`

### What OCR Struggles With ⚠️
- **Handwritten text** - Type it if possible
- **Small fonts** - Zoom in before screenshot
- **Low contrast** - Light text on light background
- **Tilted text** - Straighten image if needed

---

## 🚨 Common OCR Mistakes

### Number Recognition Issues
| **OCR Sees** | **Actually Is** | **Fix** |
|--------------|-----------------|---------|
| `$1O00` | `$1000` | O → 0 |
| `$I,500` | `$1,500` | I → 1 |
| `8OO miles` | `800 miles` | O → 0 |
| `5OO0 lbs` | `5000 lbs` | O → 0 |

### City Name Fixes
| **OCR Detects** | **Should Be** | **Common Cause** |
|-----------------|---------------|------------------|
| `Dal as, TX` | `Dallas, TX` | Letter spacing |
| `Hous on, TX` | `Houston, TX` | Font issues |
| `Ch cago, IL` | `Chicago, IL` | Low resolution |

---

## ⚡ Instant Fixes

### When Fields Are Blank
1. **Check image quality** - Can you read it clearly?
2. **Try manual crop** - Remove everything except load info
3. **Retake with better lighting** - Natural light works best
4. **Enter manually** - Always unlimited, even on Free plan

### When Numbers Are Wrong
1. **Click Edit** on wrong field
2. **Type correct number** - App learns from corrections
3. **Check for extra zeros** - `$15000` vs `$1500`
4. **Verify decimal places** - `$1234` vs `$12.34`

### When Cities Are Wrong  
1. **Edit to correct format** - `City, ST` format works best
2. **Use common abbreviations** - TX, CA, FL, etc.
3. **Check spelling** - App learns your common routes
4. **Be consistent** - Use same format each time

---

## 📊 Weekly Upload Limits

### Free Plan (4/week)
- **Resets:** Every Sunday at midnight
- **Counter:** Shows on dashboard "X of 4 used"
- **When limit reached:** Use manual entry (unlimited)
- **Upgrade option:** Pro plan for 100/week

### Pro Plan (100/week)  
- **Resets:** Every Sunday at midnight
- **Counter:** Shows remaining uploads
- **High usage:** You're a power user! 
- **Manual entry:** Still unlimited as backup

---

## 🔧 Troubleshooting Steps

### OCR Upload Failed
1. **Check file size** - Under 10MB works best
2. **Try different format** - PNG if JPG fails
3. **Check internet** - Slow connection can timeout
4. **Clear browser cache** - Sometimes helps
5. **Try different browser** - Chrome works best

### Processing Takes Forever
1. **Large file?** - Compress or resize image
2. **Slow internet?** - Try smaller image
3. **Many users?** - Try again in few minutes
4. **Server issue?** - Check status or contact support

### Results Don't Make Sense
1. **Review original image** - Is text clear?
2. **Check for extra text** - Crop tighter
3. **Multiple loads in image?** - OCR gets confused
4. **Try manual entry** - Sometimes faster anyway

---

## 💎 Pro OCR Features

### Enhanced Processing
- **100 uploads/week** - Heavy users covered
- **Priority processing** - Faster queue
- **Advanced corrections** - Better AI field detection
- **Learning system** - Remembers your preferences

### AI Assistance
- **Smart field mapping** - Knows your load board formats
- **Error correction** - Fixes common OCR mistakes
- **Confidence scoring** - Shows reliability of each field
- **Pattern recognition** - Gets better over time

---

## 📱 Mobile OCR Best Practices

### iPhone Camera Settings
- **Format:** Most Compatible (not High Efficiency)
- **HDR:** On for better contrast
- **Flash:** Off (use natural light instead)
- **Grid:** On to help with straight shots

### Android Camera Settings  
- **Resolution:** Highest available
- **HDR:** Auto or On
- **Scene mode:** Auto or Text (if available)
- **Stabilization:** On if available

### Taking the Shot
1. **Hold phone steady** - Use both hands
2. **Tap to focus** - On the text area
3. **Wait for focus** - Let camera adjust
4. **Take multiple** - Pick the clearest one

---

## 🆘 When OCR Completely Fails

### Immediate Solutions
- **Manual entry** - Always works, unlimited
- **Type while looking at image** - Often faster
- **Use voice dictation** - For hands-free entry
- **Take better photo** - Try again with tips above

### Report Persistent Issues
- **Email support** - Include original image
- **Describe document type** - Help us improve
- **Share what fields failed** - Specific feedback helps
- **Try debug mode** - Add `?debug=1` to URL

---

## 💡 Power User Tips

### Batch Processing
- **Take multiple screenshots** - Process when connected
- **Same load board format** - OCR learns patterns  
- **Consistent cropping** - Develops muscle memory
- **Quick corrections** - Edit immediately while fresh

### Accuracy Improvement  
- **Rate confirmation** - More accurate than search results
- **Clean format** - Forward emails to remove threading
- **Zoom before screenshot** - Makes text larger
- **Landscape orientation** - Sometimes better for load boards

---

**🔖 Bookmark this page** for quick OCR troubleshooting on mobile!

*Updated for LoadMaster GPT v2.0 | January 2024*