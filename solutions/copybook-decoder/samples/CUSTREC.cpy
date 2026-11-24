      * CUSTOMER MASTER RECORD - DAILY EXTRACT FROM CORE BANKING
      * LAST CHANGED 1998 (Y2K DATE EXPANSION)
       01  CUSTOMER-RECORD.
           05  CUST-ID                 PIC 9(8).
           05  CUST-NAME               PIC X(30).
           05  CUST-TYPE               PIC X.
               88  CUST-RETAIL         VALUE 'R'.
               88  CUST-CORPORATE      VALUE 'C'.
           05  OPEN-DATE               PIC 9(8).
           05  OPEN-DATE-R REDEFINES OPEN-DATE.
               10  OPEN-YYYY           PIC 9(4).
               10  OPEN-MM             PIC 99.
               10  OPEN-DD             PIC 99.
           05  BALANCE                 PIC S9(11)V99 COMP-3.
           05  CREDIT-LIMIT            PIC S9(7)V99.
           05  TXN-COUNT               PIC 9(4) COMP.
           05  ADDRESS-LINE            PIC X(20) OCCURS 2 TIMES.
           05  COUNTRY-CODE            PIC XX.
           05  RISK-SCORE              PIC S999 COMP-3.
           05  FILLER                  PIC X(5).
