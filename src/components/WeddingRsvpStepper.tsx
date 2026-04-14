import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Step from '@mui/material/Step'
import StepContent from '@mui/material/StepContent'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import emailjs from '@emailjs/browser'
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'

const ALCOHOL_OPTIONS: { id: string; label: string }[] = [
  { id: 'champagne', label: 'Шампанское' },
  { id: 'red_dry', label: 'Красное сухое вино' },
  { id: 'red_semi', label: 'Красное полусладкое вино' },
  { id: 'white_semi', label: 'Белое полусладкое вино' },
  { id: 'white_dry', label: 'Белое сухое вино' },
  { id: 'whiskey', label: 'Виски' },
  { id: 'cognac', label: 'Коньяк' },
  { id: 'vodka', label: 'Водка' },
  { id: 'rum', label: 'Ром' },
  { id: 'gin', label: 'Джин' },
  { id: 'tequila', label: 'Текила' },
  { id: 'soft', label: 'Безалкогольные напитки' },
]

const MEAL_OPTIONS: { id: string; label: string }[] = [
  { id: 'meat', label: 'Мясо' },
  { id: 'fish', label: 'Рыба' },
]

const RSVP_STEP_LABELS = [
  'Имя и фамилия',
  'Присутствие',
  'Напитки',
  'Горячее блюдо',
  'Пожелания для организаторов',
] as const

export type RsvpFormValues = {
  fullName: string
  attendance: 'yes' | 'no' | undefined
  alcohol: string[]
  /** Одно горячее блюдо */
  meal: '' | 'meat' | 'fish'
  /** Необязательно: аллергии, пожелания по столу и т.п. */
  wishes: string
}

function subscribeDomTheme(cb: () => void) {
  const el = document.documentElement
  const obs = new MutationObserver(cb)
  obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

function snapshotDomTheme(): 'light' | 'dark' {
  const t = document.documentElement.getAttribute('data-theme')
  if (t === 'dark') return 'dark'
  if (t === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function serverDomTheme(): 'light' {
  return 'light'
}

function useDomColorMode(): 'light' | 'dark' {
  return useSyncExternalStore(subscribeDomTheme, snapshotDomTheme, serverDomTheme)
}

function RsvpMuiThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useDomColorMode()
  const theme = useMemo(() => {
    /** Одна линия для StepConnector и StepContent — иначе два цвета и сдвиг пикселей */
    const stepLine =
      mode === 'dark' ? 'rgba(192, 132, 252, 0.45)' : 'rgba(147, 51, 234, 0.42)'

    return createTheme({
      palette: {
        mode,
        primary: { main: mode === 'dark' ? '#c084fc' : '#9333ea' },
        background: {
          default: mode === 'dark' ? '#16171d' : '#faf8f5',
          paper: mode === 'dark' ? '#1e1f26' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#f3f4f6' : '#1c1917',
          secondary: mode === 'dark' ? '#9ca3af' : '#57534e',
        },
      },
      shape: { borderRadius: 10 },
      typography: {
        fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
      },
      components: {
        MuiStepConnector: {
          styleOverrides: {
            line: {
              borderLeftColor: stepLine,
              borderColor: stepLine,
            },
          },
        },
        MuiStepContent: {
          styleOverrides: {
            root: ({ theme, ownerState }) => ({
              marginLeft: theme.spacing(1.5),
              ...(ownerState.last
                ? { borderLeft: 'none' }
                : {
                    borderLeftWidth: 1,
                    borderLeftStyle: 'solid',
                    borderLeftColor: stepLine,
                  }),
              [theme.breakpoints.down('sm')]: {
                paddingLeft: theme.spacing(2.5),
                paddingTop: theme.spacing(0.5),
                paddingBottom: theme.spacing(1),
              },
            }),
          },
        },
        MuiStepLabel: {
          styleOverrides: {
            root: ({ theme }) => ({
              [theme.breakpoints.down('sm')]: {
                paddingBottom: theme.spacing(0.25),
                '& .MuiStepLabel-label': {
                  fontSize: '0.8125rem',
                },
              },
            }),
          },
        },
      },
    })
  }, [mode])
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

function StepName() {
  const {
    control,
    formState: { errors },
  } = useFormContext<RsvpFormValues>()
  return (
    <Controller
      name="fullName"
      control={control}
      rules={{ required: 'Укажите имя и фамилию' }}
      render={({ field }) => (
        <TextField
          {...field}
          label="Введите Ваше имя и фамилию"
          required
          fullWidth
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          variant="outlined"
          margin="dense"
        />
      )}
    />
  )
}

function StepPresence({
  onAttendancePick,
}: {
  onAttendancePick?: (
    value: 'yes' | 'no',
    previous: 'yes' | 'no' | undefined,
  ) => void
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<RsvpFormValues>()
  return (
    <FormControl
      error={!!errors.attendance}
      component="fieldset"
      sx={{ mt: { xs: 0.5, sm: 1 } }}
    >
      <FormLabel component="legend" required>
        Присутствие
      </FormLabel>
      <Controller
        name="attendance"
        control={control}
        rules={{ required: 'Выберите вариант' }}
        render={({ field }) => (
          <RadioGroup
            name={field.name}
            ref={field.ref}
            value={field.value ?? ''}
            onBlur={field.onBlur}
            onChange={(e) => {
              const v = e.target.value as 'yes' | 'no'
              const previous = field.value
              field.onChange(v)
              onAttendancePick?.(v, previous)
            }}
          >
            <FormControlLabel
              value="yes"
              control={<Radio color="primary" />}
              label="Я с удовольствием приду"
            />
            <FormControlLabel
              value="no"
              control={<Radio color="primary" />}
              label="К сожалению, не смогу присутствовать"
            />
          </RadioGroup>
        )}
      />
      {errors.attendance && (
        <FormHelperText>{errors.attendance.message}</FormHelperText>
      )}
    </FormControl>
  )
}

function StepAlcohol() {
  const { control } = useFormContext<RsvpFormValues>()
  return (
    <Box sx={{ mt: { xs: 0.5, sm: 1 } }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 1, sm: 2 } }}
      >
        Мы хотим, чтобы свадьба прошла весело, поэтому просим Вас выбрать
        алкоголь, который Вы предпочитаете:
      </Typography>
      <FormGroup>
        <Controller
          name="alcohol"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 0.5,
              }}
            >
              {ALCOHOL_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={
                    <Checkbox
                      color="primary"
                      checked={value.includes(opt.id)}
                      onChange={(_, checked) => {
                        if (checked) onChange([...value, opt.id])
                        else onChange(value.filter((id) => id !== opt.id))
                      }}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </Box>
          )}
        />
      </FormGroup>
    </Box>
  )
}

function StepMeals() {
  const {
    control,
    formState: { errors },
  } = useFormContext<RsvpFormValues>()
  return (
    <Box sx={{ mt: { xs: 0.5, sm: 1 } }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 1, sm: 2 } }}
      >
        Так же уточните Ваши предпочтения в горячих блюдах:
      </Typography>
      <FormControl error={!!errors.meal} component="fieldset">
        <FormLabel component="legend" required>
          Горячее блюдо
        </FormLabel>
        <Controller
          name="meal"
          control={control}
          rules={{
            validate: (v, form) => {
              if (form.attendance !== 'yes') return true
              return v ? true : 'Выберите одно блюдо'
            },
          }}
          render={({ field }) => (
            <RadioGroup
              name={field.name}
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(e) => {
                field.onChange(e.target.value as 'meat' | 'fish')
              }}
            >
              {MEAL_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  value={opt.id}
                  control={<Radio color="primary" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          )}
        />
        {errors.meal && <FormHelperText>{errors.meal.message}</FormHelperText>}
      </FormControl>
    </Box>
  )
}

function SkippedStepHint({ children }: { children: string }) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mt: { xs: 0.5, sm: 1 }, py: { xs: 0.5, sm: 1 } }}
    >
      {children}
    </Typography>
  )
}

function StepWishes() {
  const { control } = useFormContext<RsvpFormValues>()
  return (
    <Box sx={{ mt: { xs: 0.5, sm: 1 } }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: { xs: 1, sm: 2 }, lineHeight: 1.6 }}
      >
        Аллергии, ограничения по меню или просто тёплое слово — всё, что важно
        учесть. Можно оставить пустым.
      </Typography>
      <Controller
        name="wishes"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Комментарий для нас"
            multiline
            minRows={3}
            maxRows={12}
            fullWidth
            placeholder="Например: без орехов, предпочитаю столик у окна…"
            variant="outlined"
          />
        )}
      />
    </Box>
  )
}

function buildEmailPayload(data: RsvpFormValues) {
  const alcoholLabels = data.alcohol
    .map((id) => ALCOHOL_OPTIONS.find((o) => o.id === id)?.label ?? id)
    .join(', ')
  const mealLabel = data.meal
    ? MEAL_OPTIONS.find((o) => o.id === data.meal)?.label ?? data.meal
    : '—'
  const wishesLine =
    data.wishes.trim() !== '' ? data.wishes.trim() : '—'

  return {
    fullName: data.fullName,
    attendance:
      data.attendance === 'yes'
        ? 'Я с удовольствием приду'
        : data.attendance === 'no'
          ? 'Не смогу присутствовать'
          : '',
    attendance_code: data.attendance ?? '',
    alcohol: alcoholLabels || '—',
    meals: mealLabel,
    wishes: wishesLine,
    message: [
      `Имя: ${data.fullName}`,
      `Присутствие: ${data.attendance === 'yes' ? 'приду' : data.attendance === 'no' ? 'не приду' : ''}`,
      data.attendance === 'yes'
        ? `Алкоголь: ${alcoholLabels || 'не выбрано'}`
        : '',
      data.attendance === 'yes' ? `Горячее: ${mealLabel}` : '',
      `Пожелания: ${wishesLine}`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function RsvpStepperInner() {
  const methods = useForm<RsvpFormValues>({
    defaultValues: {
      fullName: '',
      attendance: undefined,
      alcohol: [],
      meal: '',
      wishes: '',
    },
    mode: 'onBlur',
  })
  const {
    control,
    trigger,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = methods

  const attendance = useWatch({ control, name: 'attendance' })
  const [activeStep, setActiveStep] = useState(0)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )

  const stepCompleted = useCallback(
    (index: number) => {
      if (index === 0) return activeStep > 0
      if (index === 1) return activeStep > 1
      if (index === 2)
        return attendance === 'no' || activeStep > 2
      if (index === 3)
        return attendance === 'no' || activeStep > 3
      if (index === 4) return activeStep > 4
      return false
    },
    [activeStep, attendance],
  )

  const goNext = useCallback(async () => {
    if (activeStep === 0) {
      const ok = await trigger('fullName')
      if (ok) setActiveStep(1)
      return
    }
    if (activeStep === 1) {
      const ok = await trigger('attendance')
      if (!ok) return
      if (attendance === 'yes') setActiveStep(2)
      else setActiveStep(4)
      return
    }
    if (activeStep === 2 && attendance === 'yes') {
      setActiveStep(3)
      return
    }
    if (activeStep === 3 && attendance === 'yes') {
      setActiveStep(4)
    }
  }, [activeStep, attendance, trigger])

  const goBack = useCallback(() => {
    setActiveStep((s) => {
      if (s === 4 && attendance === 'no') return 1
      return Math.max(0, s - 1)
    })
  }, [attendance])

  const onSubmit = useCallback(
    async (data: RsvpFormValues) => {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

      if (!serviceId || !templateId || !publicKey) {
        console.error(
          'EmailJS: задайте VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY в .env',
        )
        setSubmitStatus('error')
        return
      }

      const templateParams = buildEmailPayload(data)

      try {
        await emailjs.send(serviceId, templateId, templateParams, {
          publicKey,
        })
        setSubmitStatus('success')
        reset()
        setActiveStep(0)
      } catch (e) {
        console.error(e)
        setSubmitStatus('error')
      }
    },
    [reset],
  )

  if (submitStatus === 'success') {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 3,
          px: 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
          marginBottom: 2.5,
        }}
      >
        <Typography variant="h6" gutterBottom color="primary">
          Спасибо! Ответ отправлен
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Мы получили ваше сообщение на почту и очень ждём встречи.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setSubmitStatus('idle')}
        >
          Отправить ещё один ответ
        </Button>
      </Box>
    )
  }

  return (
    <FormProvider {...methods}>
      <Box component="form" noValidate sx={{ width: '100%', textAlign: 'left' }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {RSVP_STEP_LABELS.map((label, index) => (
            <Step key={label} completed={stepCompleted(index)}>
              <StepLabel
                optional={
                  index === 2 && attendance === 'no' ? (
                    <Typography variant="caption" color="text.secondary">
                      не требуется
                    </Typography>
                  ) : index === 2 && attendance === 'yes' ? (
                    'по желанию'
                  ) : index === 3 && attendance === 'no' ? (
                    <Typography variant="caption" color="text.secondary">
                      не требуется
                    </Typography>
                  ) : index === 4 ? (
                    'необязательно'
                  ) : undefined
                }
              >
                <Typography variant="subtitle2" component="span">
                  {label}
                </Typography>
              </StepLabel>
              <StepContent>
                {index === 0 && <StepName />}
                {index === 1 && (
                  <StepPresence
                    onAttendancePick={(v, prev) => {
                      if (v === 'no' && activeStep > 1) {
                        setActiveStep(1)
                      }
                      if (v === 'yes' && prev === 'no') {
                        setValue('alcohol', [])
                        setValue('meal', '')
                        setValue('wishes', '')
                      }
                    }}
                  />
                )}
                {index === 2 &&
                  (attendance === 'yes' ? (
                    <StepAlcohol />
                  ) : attendance === 'no' ? (
                    <SkippedStepHint>
                      Этот шаг не нужен — вы отметили, что не сможете прийти.
                    </SkippedStepHint>
                  ) : null)}
                {index === 3 &&
                  (attendance === 'yes' ? (
                    <StepMeals />
                  ) : attendance === 'no' ? (
                    <SkippedStepHint>
                      Этот шаг не нужен — вы отметили, что не сможете прийти.
                    </SkippedStepHint>
                  ) : null)}
                {index === 4 && <StepWishes />}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        <Box
          sx={{
            mt: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}
        >
          {activeStep === 0 && (
            <Button variant="contained" onClick={() => void goNext()}>
              Далее
            </Button>
          )}

          {activeStep === 1 && (
            <>
              <Button onClick={goBack} disabled={isSubmitting}>
                Назад
              </Button>
              <Button
                variant="contained"
                onClick={() => void goNext()}
                disabled={isSubmitting}
              >
                Далее
              </Button>
            </>
          )}

          {activeStep === 2 && attendance === 'yes' && (
            <>
              <Button onClick={goBack} disabled={isSubmitting}>
                Назад
              </Button>
              <Button
                variant="contained"
                onClick={() => void goNext()}
                disabled={isSubmitting}
              >
                Далее
              </Button>
            </>
          )}

          {activeStep === 3 && attendance === 'yes' && (
            <>
              <Button onClick={goBack} disabled={isSubmitting}>
                Назад
              </Button>
              <Button
                variant="contained"
                onClick={() => void goNext()}
                disabled={isSubmitting}
              >
                Далее
              </Button>
            </>
          )}

          {activeStep === 4 && (
            <>
              <Button onClick={goBack} disabled={isSubmitting}>
                Назад
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                onClick={() => void handleSubmit(onSubmit)()}
                sx={{ boxShadow: 2, px: 3 }}
              >
                {isSubmitting ? 'Отправка…' : 'Отправить ответ'}
              </Button>
            </>
          )}
        </Box>

        {submitStatus === 'error' && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            Не удалось отправить ответ. Попробуйте чуть позже или напишите нам на
            почту.
          </Typography>
        )}

        <Divider sx={{ my: { xs: 2, sm: 3 }, borderColor: 'divider' }} />

        <Box
          sx={{
            p: { xs: 1.5, sm: 2.25 },
            mb: { xs: 2.5, sm: 3 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (t) =>
              t.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.02)',
          }}
        >
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              letterSpacing: '0.12em',
              color: 'text.secondary',
              mb: 1.5,
              fontWeight: 600,
            }}
          >
            Как устроена анкета
          </Typography>
          <Stack spacing={1.25} component="ul" sx={{ m: 0, pl: 2.25, listStyle: 'disc' }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ display: 'list-item' }}>
              <strong style={{ color: 'inherit', fontWeight: 600 }}>Обязательно:</strong>{' '}
              имя и фамилия, ответ о присутствии.
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ display: 'list-item' }}>
              Если отмечаете, что{' '}
              <strong style={{ fontWeight: 600 }}>придёте</strong>, на шаге с
              горячим блюдом нужно выбрать{' '}
              <strong style={{ fontWeight: 600 }}>мясо или рыбу</strong> — без
              этого отправка не завершится.
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ display: 'list-item' }}>
              Напитки по желанию; блок{' '}
              <strong style={{ fontWeight: 600 }}>«Пожелания для организаторов»</strong>{' '}
              в конце — необязателен: аллергии, детали, тёплое слово.
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mt: { xs: 1.5, sm: 2 },
              pt: { xs: 1.5, sm: 2 },
              borderTop: '1px solid',
              borderColor: 'divider',
              lineHeight: 1.6,
            }}
          >
            После отправки ваш ответ приходит{' '}
            <strong>на почту организаторам</strong> — мы храним данные только для
            подготовки праздника.
          </Typography>
        </Box>
      </Box>
    </FormProvider>
  )
}

/** Вертикальный степпер в духе MUI + react-hook-form + EmailJS */
export function WeddingRsvpStepper() {
  return (
    <RsvpMuiThemeProvider>
      <Box
        sx={{
          maxWidth: 560,
          mx: 'auto',
          px: { xs: 0, sm: 1 },
          pt: { xs: 0.5, sm: 2 },
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          component="h3"
          sx={{
            display: 'block',
            textAlign: 'center',
            letterSpacing: { xs: '0.22em', sm: '0.28em' },
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            fontWeight: 600,
            textTransform: 'uppercase',
            mb: { xs: 2, sm: 3.5 },
            mt: 0,
            opacity: 0.92,
          }}
        >
          Вопросы для гостей
        </Typography>
        <RsvpStepperInner />
      </Box>
    </RsvpMuiThemeProvider>
  )
}

export default WeddingRsvpStepper
