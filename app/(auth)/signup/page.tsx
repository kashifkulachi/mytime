// "use client";

// import { useState, useTransition } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Controller, useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   ArrowRight,
//   BriefcaseMedical,
//   Eye,
//   EyeOff,
//   Loader2,
//   LockKeyhole,
//   Mail,
//   Stethoscope,
//   UserRound,
// } from "lucide-react";
// import { toast } from "sonner";

// import { signupAction } from "@/app/(auth)/signup/actions";
// import { signupSchema, type SignupInput } from "@/lib/schemas/signup.schema";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Field, FieldError, FieldLabel } from "@/components/ui/field";
// import Image from "next/image";

// export default function SignupPage() {
//   const router = useRouter();

//   const [isPending, startTransition] = useTransition();

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const form = useForm<SignupInput>({
//     resolver: zodResolver(signupSchema),
//     defaultValues: {
//       role: "patient",
//       fullName: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//     },
//     mode: "onTouched",
//   });

//   const onSubmit = (values: SignupInput) => {
//     startTransition(async () => {
//       const formData = new FormData();

//       formData.set("role", values.role);
//       formData.set("fullName", values.fullName);
//       formData.set("email", values.email);
//       formData.set("password", values.password);
//       formData.set("confirmPassword", values.confirmPassword);

//       const result = await signupAction(
//         {
//           success: false,
//           message: "",
//         },
//         formData,
//       );

//       if (!result.success) {
//         if (result.fieldErrors) {
//           const fields = result.fieldErrors;

//           if (fields.fullName?.[0]) {
//             form.setError("fullName", {
//               type: "server",
//               message: fields.fullName[0],
//             });
//           }

//           if (fields.email?.[0]) {
//             form.setError("email", {
//               type: "server",
//               message: fields.email[0],
//             });
//           }

//           if (fields.password?.[0]) {
//             form.setError("password", {
//               type: "server",
//               message: fields.password[0],
//             });
//           }

//           if (fields.confirmPassword?.[0]) {
//             form.setError("confirmPassword", {
//               type: "server",
//               message: fields.confirmPassword[0],
//             });
//           }

//           if (fields.role?.[0]) {
//             form.setError("role", {
//               type: "server",
//               message: fields.role[0],
//             });
//           }
//         }

//         toast.error(result.message);
//         return;
//       }

//       toast.success(result.message);

//       /**
//        * We send the user to Login after account creation.
//        *
//        * With email verification enabled, the user must first confirm
//        * their email before authentication succeeds.
//        */
//       router.push("/login?registered=true");
//     });
//   };

//   return (
//     <main className="min-h-screen bg-[#FFF]">
//       <div className="grid min-h-screen lg:grid-cols-[50.3%_49.7%]">
//         {/* =========================================================
//             LEFT SIDE
//         ========================================================== */}
//         <section
//           className="relative hidden min-h-screen overflow-hidden bg-fixed bg-slate-900 bg-cover bg-center lg:block"
//           style={{
//             backgroundImage: "url('/oximeter-assessment.jpg')",
//           }}
//         >
//           {/* Dark image overlay */}
//           <div className="absolute inset-0 bg-slate-950/48" />

//           {/* Slight blue medical tint */}
//           <div className="absolute inset-0 bg-[#062b4b]/18" />

//           <div className="relative z-10 flex min-h-screen flex-col px-[9%] py-[7%]">
//             {/* Logo */}
//             {/* <div className="flex items-center gap-2 text-white">
//               <HeartPulse className="h-10 w-10" strokeWidth={2.5} />

//               <span className="text-[30px] font-bold tracking-[-0.8px]">
//                 MyTime Health
//               </span>
//             </div> */}

//             {/* Bottom marketing copy */}
//             <div className="mt-auto max-w-[450px] pb-[3%]">
//               <h1 className="text-[45px] font-bold leading-[1.19] tracking-[-1.3px] text-white">
//                 Connecting patients and healthcare professionals through smarter
//                 health monitoring.
//               </h1>

//               <p className="mt-7 max-w-[410px] text-[16px] leading-7 text-blue-100/80">
//                 Experience seamless care and comprehensive insights with our
//                 enterprise-grade platform.
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* =========================================================
//             RIGHT SIDE
//         ========================================================== */}
//         <section className="flex min-h-screen items-center justify-center px-5 py-5 sm:px-8 lg:px-12">
//           <div className="w-full max-w-[500px]">
//             {/* Mobile branding */}
//             {/* <div className="mb-10 flex items-center gap-2 text-[#052b4f] lg:hidden">
//               <HeartPulse className="h-8 w-8" strokeWidth={2.5} />

//               <span className="text-2xl font-bold">MyTime Health</span>
//             </div> */}

//             <Image
//               src="/Logo.jpg"
//               width={350}
//               height={40}
//               alt="MYTime Logo"
//               quality={100}
//               unoptimized
//               className="object-cover"
//             />

//             {/* Heading */}
//             <div className="mb-8">
//               <h2 className="text-[25px] font-bold tracking-[-0.4px] text-slate-950">
//                 Create your account
//               </h2>

//               <p className="mt-1 max-w-[430px] text-[15px] leading-[21px] text-slate-700">
//                 Join our MyTime monitoring platform and stay updated with your
//                 health.
//               </p>
//             </div>

//             <form
//               onSubmit={form.handleSubmit(onSubmit)}
//               className="space-y-[18px]"
//               noValidate
//             >
//               {/* =====================================================
//                   ROLE
//               ====================================================== */}
//               <Controller
//                 name="role"
//                 control={form.control}
//                 render={({ field, fieldState }) => (
//                   <Field data-invalid={fieldState.invalid}>
//                     <FieldLabel className="mb-2 block text-sm font-semibold text-slate-950">
//                       I am a...
//                     </FieldLabel>

//                     <div className="grid grid-cols-2 gap-2">
//                       <button
//                         type="button"
//                         disabled={isPending}
//                         onClick={() => field.onChange("patient")}
//                         className={[
//                           "flex h-[53px] items-center gap-3 rounded-[10px] border px-4 text-left transition-all",
//                           "focus-visible:outline-none  cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40",
//                           field.value === "patient"
//                             ? "border-blue-600 bg-blue-50 text-slate-950"
//                             : "border-slate-300 bg-transparent text-slate-950 hover:border-slate-400",
//                         ].join(" ")}
//                       >
//                         <span
//                           className={[
//                             "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2",
//                             field.value === "patient"
//                               ? "border-blue-600"
//                               : "border-slate-500",
//                           ].join(" ")}
//                         >
//                           {field.value === "patient" && (
//                             <span className="h-[9px] w-[9px] rounded-full bg-blue-600" />
//                           )}
//                         </span>

//                         <UserRound className="h-[18px] w-[18px]" />

//                         <span className="text-sm font-semibold">Patient</span>
//                       </button>

//                       <button
//                         type="button"
//                         disabled={isPending}
//                         onClick={() => field.onChange("doctor")}
//                         className={[
//                           "flex h-[53px] items-center gap-3 rounded-[10px] border px-4 text-left transition-all",
//                           "focus-visible:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/40",
//                           field.value === "doctor"
//                             ? "border-blue-600 bg-blue-50 text-slate-950"
//                             : "border-slate-300 bg-transparent text-slate-950 hover:border-slate-400",
//                         ].join(" ")}
//                       >
//                         <span
//                           className={[
//                             "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2",
//                             field.value === "doctor"
//                               ? "border-blue-600"
//                               : "border-slate-500",
//                           ].join(" ")}
//                         >
//                           {field.value === "doctor" && (
//                             <span className="h-[9px] w-[9px] rounded-full bg-blue-600" />
//                           )}
//                         </span>

//                         <Stethoscope className="h-[18px] w-[18px]" />

//                         <span className="text-sm font-semibold">Doctor</span>
//                       </button>
//                     </div>

//                     {fieldState.invalid && (
//                       <FieldError errors={[fieldState.error]} />
//                     )}
//                   </Field>
//                 )}
//               />

//               {/* =====================================================
//                   FULL NAME
//               ====================================================== */}

//               <Controller
//                 name="fullName"
//                 control={form.control}
//                 render={({ field, fieldState }) => (
//                   <Field data-invalid={fieldState.invalid}>
//                     <FieldLabel
//                       htmlFor={field.name}
//                       className="mb-2 block text-sm font-semibold text-slate-950"
//                     >
//                       Full Name
//                     </FieldLabel>

//                     <div className="relative">
//                       <BriefcaseMedical className="pointer-events-none absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-slate-600" />

//                       <Input
//                         {...field}
//                         id={field.name}
//                         type="text"
//                         autoComplete="name"
//                         placeholder="Jane Doe"
//                         disabled={isPending}
//                         aria-invalid={fieldState.invalid}
//                         className="h-[47px] rounded-[9px] border-slate-300 bg-transparent pl-[58px] text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
//                       />
//                     </div>

//                     {fieldState.invalid && (
//                       <FieldError errors={[fieldState.error]} />
//                     )}
//                   </Field>
//                 )}
//               />

//               {/* =====================================================
//                   EMAIL
//               ====================================================== */}
//               <Controller
//                 name="email"
//                 control={form.control}
//                 render={({ field, fieldState }) => (
//                   <Field data-invalid={fieldState.invalid}>
//                     <FieldLabel
//                       htmlFor={field.name}
//                       className="mb-2 block text-sm font-semibold text-slate-950"
//                     >
//                       Email Address
//                     </FieldLabel>

//                     <div className="relative">
//                       <Mail className="pointer-events-none absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-slate-600" />

//                       <Input
//                         {...field}
//                         id={field.name}
//                         type="email"
//                         autoComplete="email"
//                         placeholder="jane@example.com"
//                         disabled={isPending}
//                         aria-invalid={fieldState.invalid}
//                         className="h-[47px] rounded-[9px] border-slate-300 bg-transparent pl-[58px] text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
//                       />
//                     </div>

//                     {fieldState.invalid && (
//                       <FieldError errors={[fieldState.error]} />
//                     )}
//                   </Field>
//                 )}
//               />

//               {/* =====================================================
//                   PASSWORD
//               ====================================================== */}
//               <Controller
//                 name="password"
//                 control={form.control}
//                 render={({ field, fieldState }) => (
//                   <Field data-invalid={fieldState.invalid}>
//                     <FieldLabel
//                       htmlFor={field.name}
//                       className="mb-2 block text-sm font-semibold text-slate-950"
//                     >
//                       Password
//                     </FieldLabel>

//                     <div className="relative">
//                       <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-slate-600" />

//                       <Input
//                         {...field}
//                         id={field.name}
//                         type={showPassword ? "text" : "password"}
//                         autoComplete="new-password"
//                         placeholder="••••••••"
//                         disabled={isPending}
//                         aria-invalid={fieldState.invalid}
//                         className="h-[47px] rounded-[9px] border-slate-300 bg-transparent pl-[58px] pr-12 text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
//                       />

//                       <button
//                         type="button"
//                         onClick={() => setShowPassword((current) => !current)}
//                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-950"
//                         aria-label={
//                           showPassword ? "Hide password" : "Show password"
//                         }
//                       >
//                         {showPassword ? (
//                           <EyeOff className="h-[20px] w-[20px]" />
//                         ) : (
//                           <Eye className="h-[20px] w-[20px]" />
//                         )}
//                       </button>
//                     </div>

//                     {fieldState.invalid && (
//                       <FieldError errors={[fieldState.error]} />
//                     )}
//                   </Field>
//                 )}
//               />

//               {/* =====================================================
//                   CONFIRM PASSWORD
//               ====================================================== */}
//               <Controller
//                 name="confirmPassword"
//                 control={form.control}
//                 render={({ field, fieldState }) => (
//                   <Field data-invalid={fieldState.invalid}>
//                     <FieldLabel
//                       htmlFor={field.name}
//                       className="mb-2 block text-sm font-semibold text-slate-950"
//                     >
//                       Confirm Password
//                     </FieldLabel>

//                     <div className="relative">
//                       <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-slate-600" />

//                       <Input
//                         {...field}
//                         id={field.name}
//                         type={showConfirmPassword ? "text" : "password"}
//                         autoComplete="new-password"
//                         placeholder="••••••••"
//                         disabled={isPending}
//                         aria-invalid={fieldState.invalid}
//                         className="h-[47px] rounded-[9px] border-slate-300 bg-transparent pl-[58px] pr-12 text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
//                       />

//                       <button
//                         type="button"
//                         onClick={() =>
//                           setShowConfirmPassword((current) => !current)
//                         }
//                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-950"
//                         aria-label={
//                           showConfirmPassword
//                             ? "Hide confirmed password"
//                             : "Show confirmed password"
//                         }
//                       >
//                         {showConfirmPassword ? (
//                           <EyeOff className="h-[20px] w-[20px]" />
//                         ) : (
//                           <Eye className="h-[20px] w-[20px]" />
//                         )}
//                       </button>
//                     </div>

//                     {fieldState.invalid && (
//                       <FieldError errors={[fieldState.error]} />
//                     )}
//                   </Field>
//                 )}
//               />

//               {/* =====================================================
//                   TERMS
//               ====================================================== */}
//               <p className="px-2 pt-1 text-center text-[12px] leading-[18px] text-slate-700">
//                 By creating an account, you agree to our{" "}
//                 <Link
//                   href="/terms"
//                   className="font-medium text-blue-600 hover:underline"
//                 >
//                   Terms of Service
//                 </Link>{" "}
//                 and{" "}
//                 <Link
//                   href="/privacy"
//                   className="font-medium text-blue-600 hover:underline"
//                 >
//                   Privacy Policy
//                 </Link>
//                 .
//               </p>

//               {/* =====================================================
//                   SUBMIT
//               ====================================================== */}
//               <Button
//                 type="submit"
//                 disabled={isPending}
//                 className="mt-2 h-[48px] w-full cursor-pointer rounded-[10px] bg-[#032b50] text-sm font-bold text-white shadow-none hover:bg-[#06243f]"
//               >
//                 {isPending ? (
//                   <>
//                     Creating account...
//                     <Loader2 className="animate-spin" />
//                   </>
//                 ) : (
//                   <>
//                     Create Account
//                     <ArrowRight className="ml-1 h-[18px] w-[18px]" />
//                   </>
//                 )}
//               </Button>
//             </form>

//             {/* =======================================================
//                 LOGIN
//             ======================================================== */}
//             <p className="mt-9 text-center text-[13px] text-slate-700">
//               Already have an account?{" "}
//               <Link
//                 href="/login"
//                 className="font-semibold cursor-pointer text-blue-600 hover:underline"
//               >
//                 Log in
//               </Link>
//             </p>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }
import SignupForm from "./SignupForm";

import { redirectAuthenticatedUser } from "@/lib/auth/redirectAuthenticatedUser";

export default async function SignupPage() {
  /**
   * Public signup should only be visible to unauthenticated users.
   *
   * If a valid Supabase session already exists, redirect the user
   * back to the authenticated area before rendering the signup form.
   */
  await redirectAuthenticatedUser();

  return <SignupForm />;
}
