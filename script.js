// =========================================================================
// 1. OBJECT-ORIENTED PROGRAMMING (OOP) CLASSES
// =========================================================================

class Course {
    constructor(code, title, units, maxCapacity) {
        this.code = code;
        this.title = title;
        this.units = units;
        this.maxCapacity = maxCapacity;
    }

    // Rule: Validation to prevent over-enrollment
    hasAvailableSlot(currentEnrollmentCount) {
        return currentEnrollmentCount < this.maxCapacity;
    }
}

class Student {
    constructor(id) {
        this.id = id;
    }

    getEnrolledCourses() {
        return JSON.parse(localStorage.getItem('enrolledCourses')) || [];
    }

    saveEnrolledCourses(courses) {
        localStorage.setItem('enrolledCourses', JSON.stringify(courses));
    }
}

class Enrollment {
    constructor(studentId, course) {
        this.studentId = studentId;
        this.code = course.code;
        this.title = course.title;
        this.units = course.units;
        this.grade = ''; // Default empty grade upon enrollment
    }
}

// Initialize Active Student Session
const activeStudentId = sessionStorage.getItem('studentId') || "2023-7406-A";
const studentSession = new Student(activeStudentId);

// Initialize courses in localStorage if they don't exist
if (!localStorage.getItem('enrolledCourses')) {
    studentSession.saveEnrolledCourses([]);
}

// Prerequisites Mapping
const coursePrerequisites = {
    'CS 102': 'CS 101'
};

// Course Capacity Configuration Mapping
const courseCapacities = {
    'CS 101': 35,
    'CS 102': 30,
    'IT 101': 35,
    'IT 104': 25
};

// =========================================================================
// 2. CORE SYSTEM FUNCTIONS
// =========================================================================

// Function to enroll in a course
function enrollCourse(courseCode, courseTitle, units) {
    let enrolled = studentSession.getEnrolledCourses();

    // Instantiate Course using OOP Class
    const maxCapacity = courseCapacities[courseCode] || 40;
    const courseToEnroll = new Course(courseCode, courseTitle, units, maxCapacity);

    // 1. Check if already enrolled in this course without a grade
    const isAlreadyEnrolled = enrolled.some(course => course.code === courseCode && course.grade === '');
    if (isAlreadyEnrolled) {
        showCustomModal("Already Enrolled", `You are already taking ${courseCode}.`, 'warning');
        return;
    }

    // 2. Capacity Check Validation
    const currentEnrolledCount = enrolled.filter(c => c.code === courseCode).length;
    if (!courseToEnroll.hasAvailableSlot(currentEnrolledCount)) {
        showCustomModal(
            "Section Full", 
            `Sorry, ${courseCode} has reached its maximum capacity of ${courseToEnroll.maxCapacity} students.`, 
            'error'
        );
        return;
    }

    // 3. Prerequisite validation
    const prerequisite = coursePrerequisites[courseCode];
    if (prerequisite) {
        const prereqCourse = enrolled.find(course => course.code === prerequisite);

        // Scenario A: The student hasn't added this prerequisite to their records at all
        if (!prereqCourse) {
            showCustomModal(
                "Prerequisite Required", 
                `You must first add and complete the prerequisite course: ${prerequisite}.`, 
                'warning'
            );
            return;
        }

        // Scenario B: The course exists but the student has not saved their grade yet
        if (!prereqCourse.grade || prereqCourse.grade.trim() === "") {
            showCustomModal(
                "Prerequisite Grade Missing", 
                `To enroll in ${courseCode}, you must first input and save your grade for ${prerequisite} on the Grade management page.`, 
                'warning',
                true // Redirects to manage-grade.html
            );
            return;
        }

        // Validate that the grade falls within the passing threshold (1.00 - 3.00)
        const gradeValue = parseFloat(prereqCourse.grade);
        if (isNaN(gradeValue) || gradeValue > 3.00 || gradeValue < 1.00) {
            showCustomModal(
                "Requirement Not Met", 
                `A passing grade (1.00 to 3.00) in ${prerequisite} is required to enroll. (Your Grade: ${prereqCourse.grade})`, 
                'error'
            );
            return;
        }
    }

    // 4. Link Course and Student via Enrollment Class
    const newEnrollment = new Enrollment(studentSession.id, courseToEnroll);

    enrolled.push(newEnrollment);
    studentSession.saveEnrolledCourses(enrolled);

    showCustomModal(
        "Enrollment Successful!", 
        `You have successfully registered for ${courseCode} (${courseTitle}).`, 
        'success'
    );
}

// Helper function to drop a course
function dropCourse(courseCode) {
    let enrolled = studentSession.getEnrolledCourses();
    
    // Filter out the course from the student record
    enrolled = enrolled.filter(course => !(course.code === courseCode && course.grade === ''));
    
    studentSession.saveEnrolledCourses(enrolled);
    location.reload();
}